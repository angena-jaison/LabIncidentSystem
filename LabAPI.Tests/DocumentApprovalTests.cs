using System.Text;
using LabAPI.Data;
using LabAPI.Models;
using LabAPI.Services.Ai;
using LabAPI.Services.Documents;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FluentAssertions;

namespace LabAPI.Tests;

// Covers the governance rule from the project brief:
// "the AI should be grounded in the team's supplied knowledge base"
//
// Specifically, only APPROVED documents can be used by the AI.
// A Pending document must not affect retrieval.
public class DocumentApprovalTests
{
    private static (
        AppDbContext db,
        DocumentService docService,
        RagService rag
    ) CreateSystem()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);

        var user = new User
        {
            FullName = "Uploader",
            Email = "u@test.com",
            PasswordHash = "x"
        };

        db.Users.Add(user);
        db.SaveChanges();

        var chunker = new TextChunker();
        var embedder = new LocalEmbeddingService();

        var docService = new DocumentService(
            db,
            chunker,
            embedder);

        var aiSettings =
            Microsoft.Extensions.Options.Options.Create(
                new AiSettings
                {
                    TopKChunks = 3
                });

        var rag = new RagService(
            db,
            embedder,
            new LocalTextGenerationService(),
            aiSettings);

        return (db, docService, rag);
    }

    [Fact]
    public async Task NewlyUploadedDocument_StartsAsPending()
    {
        var (db, docService, _) = CreateSystem();

        var userId = db.Users.First().Id;

        var text = "Always wear gloves near acids.";

        // Test file data.
        var fileData = Encoding.UTF8.GetBytes(text);

        var result = await docService.IngestAsync(
            "Safety Doc",
            "safety.txt",
            text,
            fileData,
            "text/plain",
            userId);

        result.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task PendingDocument_IsNotUsedByTheAiAssistant()
    {
        var (db, docService, rag) = CreateSystem();

        var userId = db.Users.First().Id;

        var text =
            "Always wear nitrile gloves when handling acids in the lab.";

        var fileData = Encoding.UTF8.GetBytes(text);

        await docService.IngestAsync(
            "Glove Policy",
            "gloves.txt",
            text,
            fileData,
            "text/plain",
            userId);

        var answer = await rag.AskAsync(
            "What gloves should I wear with acids?",
            userId);

        // Not approved yet -> must not be grounded,
        // even though a relevant chunk exists in the database.
        answer.IsGrounded.Should().BeFalse();
        answer.Sources.Should().BeEmpty();
    }

    [Fact]
    public async Task ApprovedDocument_IsUsedByTheAiAssistant()
    {
        var (db, docService, rag) = CreateSystem();

        var userId = db.Users.First().Id;

        var text =
            "Always wear nitrile gloves when handling acids in the lab.";

        var fileData = Encoding.UTF8.GetBytes(text);

        var doc = await docService.IngestAsync(
            "Glove Policy",
            "gloves.txt",
            text,
            fileData,
            "text/plain",
            userId);

        await docService.ApproveAsync(
            doc.Id,
            reviewedByUserId: userId);

        var answer = await rag.AskAsync(
            "What gloves should I wear with acids?",
            userId);

        answer.IsGrounded.Should().BeTrue();
        answer.Sources.Should().NotBeEmpty();
    }
}