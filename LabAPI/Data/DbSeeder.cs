using LabAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LabAPI.Data;

// Creates some starter data so the app is demo-ready right after first run.
public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        // Relational providers (SQL Server) need migrations applied.
        // The InMemory provider used by tests doesn't support Migrate(),
        // so we just make sure the schema exists instead.
       
        db.Database.EnsureCreated();

        if (!db.Users.Any())
        {
            var admin = new User
            {
                FullName = "Admin User",
                Email = "admin@lab.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = UserRole.Administrator
            };

            var reviewer = new User
            {
                FullName = "Riya Reviewer",
                Email = "reviewer@lab.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Reviewer123!"),
                Role = UserRole.Reviewer
            };

            var labUser = new User
            {
                FullName = "Leo LabUser",
                Email = "labuser@lab.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("LabUser123!"),
                Role = UserRole.LabUser
            };

            db.Users.AddRange(admin, reviewer, labUser);
            db.SaveChanges();

            db.Incidents.Add(new Incident
            {
                Title = "Centrifuge overheating during run",
                Description = "Centrifuge #3 started emitting a burning smell mid-run and was shut down immediately.",
                Category = "Equipment Failure",
                Severity = IncidentSeverity.High,
                Status = IncidentStatus.Open,
                Equipment = "Centrifuge #3",
                OccurredAtUtc = DateTime.UtcNow.AddDays(-2),
                CreatedByUserId = labUser.Id
            });

            db.SaveChanges();
        }
    }
}
