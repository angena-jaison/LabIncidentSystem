using System.Text;
using LabAPI.Data;
using LabAPI.Middleware;
using LabAPI.Services.Ai;
using LabAPI.Services.Admin;
using LabAPI.Services.Auth;
using LabAPI.Services.Documents;
using LabAPI.Services.Incidents;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------- 1. Configuration ----------
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<AiSettings>(builder.Configuration.GetSection("Ai"));

// ---------- 2. Database ----------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ---------- 3. Authentication (JWT Bearer) ----------
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]!;

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ---------- 4. Application services (dependency injection) ----------
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IIncidentService, IncidentService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<ITextChunker, TextChunker>();
builder.Services.AddScoped<IRagService, RagService>();

// Pick the embedding + generation provider based on config, WITHOUT
// touching any other part of the app (this is the whole point of using
// interfaces here - see README "Design decision: pluggable AI providers").
var embeddingProvider = builder.Configuration["Ai:EmbeddingProvider"];
if (string.Equals(embeddingProvider, "OpenAI", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddHttpClient<IEmbeddingService, OpenAiEmbeddingService>();
    builder.Services.AddHttpClient<ITextGenerationService, OpenAiTextGenerationService>();
}
else
{
    builder.Services.AddScoped<IEmbeddingService, LocalEmbeddingService>();
    builder.Services.AddScoped<ITextGenerationService, LocalTextGenerationService>();
}

// ---------- 5. MVC + Swagger ----------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Lab Incident Management API",
        Version = "v1",
        Description = "Incident tracking + RAG-based AI assistant for a laboratory team."
    });

    // Lets you paste a JWT into Swagger's "Authorize" button to test secured endpoints.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ---------- 6. CORS (so the React frontend on a different port can call us) ----------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite's default dev port
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// ---------- 7. Apply migrations + seed data on startup ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbSeeder.Seed(db);
}

// ---------- 8. Middleware pipeline ----------
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // browse to /swagger
}

app.MapControllers();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Needed so the integration test project can reference "Program" via WebApplicationFactory<Program>.
public partial class Program { }
