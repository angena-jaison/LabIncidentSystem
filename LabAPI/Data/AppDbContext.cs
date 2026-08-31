using LabAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LabAPI.Data;

// This class represents our database. Each DbSet<T> becomes a SQL table.
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<StatusHistory> StatusHistories => Set<StatusHistory>();
    public DbSet<InvestigationNote> InvestigationNotes => Set<InvestigationNote>();
    public DbSet<CorrectiveAction> CorrectiveActions => Set<CorrectiveAction>();
    public DbSet<DocumentItem> Documents => Set<DocumentItem>();
    public DbSet<DocumentChunk> DocumentChunks => Set<DocumentChunk>();
    public DbSet<AiQueryLog> AiQueryLogs => Set<AiQueryLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // A user's email must be unique (used for login).
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Incident -> CreatedByUser (required, don't cascade-delete the user)
        modelBuilder.Entity<Incident>()
            .HasOne(i => i.CreatedByUser)
            .WithMany()
            .HasForeignKey(i => i.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Incident -> AssignedToUser (optional)
        modelBuilder.Entity<Incident>()
            .HasOne(i => i.AssignedToUser)
            .WithMany()
            .HasForeignKey(i => i.AssignedToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // If an Incident is deleted, delete its child rows too.
        modelBuilder.Entity<Incident>()
            .HasMany(i => i.StatusHistory)
            .WithOne(s => s.Incident)
            .HasForeignKey(s => s.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Incident>()
            .HasMany(i => i.InvestigationNotes)
            .WithOne(n => n.Incident)
            .HasForeignKey(n => n.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Incident>()
            .HasMany(i => i.CorrectiveActions)
            .WithOne(c => c.Incident)
            .HasForeignKey(c => c.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DocumentItem>()
            .HasMany(d => d.Chunks)
            .WithOne(c => c.DocumentItem)
            .HasForeignKey(c => c.DocumentItemId)
            .OnDelete(DeleteBehavior.Cascade);

        // These "who did it" links to User must NOT cascade-delete - deleting
        // a user account should never be allowed to silently wipe out
        // history rows. (Also avoids SQL Server's "multiple cascade paths" error.)
        modelBuilder.Entity<StatusHistory>()
            .HasOne(s => s.ChangedByUser).WithMany().HasForeignKey(s => s.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InvestigationNote>()
            .HasOne(n => n.AuthorUser).WithMany().HasForeignKey(n => n.AuthorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CorrectiveAction>()
            .HasOne(c => c.CreatedByUser).WithMany().HasForeignKey(c => c.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DocumentItem>()
            .HasOne(d => d.UploadedByUser).WithMany().HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DocumentItem>()
            .HasOne(d => d.ReviewedByUser).WithMany().HasForeignKey(d => d.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AiQueryLog>()
            .HasOne(a => a.AskedByUser).WithMany().HasForeignKey(a => a.AskedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
