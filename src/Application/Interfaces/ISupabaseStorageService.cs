namespace ZooGuide.Application.Interfaces;

public class SupabaseStorageUploadResult
{
    public bool UploadedToRemoteBucket { get; set; }
    public string StorageBucket { get; set; } = "narration-audio";
    public string ObjectPath { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string Sha256Hash { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string? RemoteStatusMessage { get; set; }
}

public interface ISupabaseStorageService
{
    bool IsRemoteStorageConfigured { get; }
    string StorageBucket { get; }
    string SupabaseUrl { get; }
    Task<SupabaseStorageUploadResult> UploadAudioAsync(Stream contentStream, string objectPath, string contentType = "audio/mpeg");
    string? ResolvePhysicalAudioPath(string? fileUrl, string? objectPath);
}
