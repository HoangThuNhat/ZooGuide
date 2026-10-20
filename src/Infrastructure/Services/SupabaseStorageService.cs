using System.Net.Http.Headers;
using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using ZooGuide.Application.Interfaces;

namespace ZooGuide.Infrastructure.Services;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _storageBucket;
    private readonly string? _serviceRoleKey;

    public SupabaseStorageService(IConfiguration? configuration = null, HttpClient? httpClient = null)
    {
        _httpClient = httpClient ?? new HttpClient();
        _supabaseUrl = (Environment.GetEnvironmentVariable("SUPABASE_URL")
            ?? configuration?["Supabase:Url"]
            ?? "https://mqawjvhflseqjjapegfk.supabase.co").TrimEnd('/');
        _storageBucket = Environment.GetEnvironmentVariable("SUPABASE_STORAGE_BUCKET")
            ?? configuration?["Supabase:StorageBucket"]
            ?? "narration-audio";
        _serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
            ?? configuration?["Supabase:ServiceRoleKey"];
    }

    public bool IsRemoteStorageConfigured =>
        !string.IsNullOrWhiteSpace(_supabaseUrl) &&
        !string.IsNullOrWhiteSpace(_serviceRoleKey) &&
        !_serviceRoleKey.Contains("your_service_role_key");

    public string StorageBucket => _storageBucket;
    public string SupabaseUrl => _supabaseUrl;

    public async Task<SupabaseStorageUploadResult> UploadAudioAsync(Stream contentStream, string objectPath, string contentType = "audio/mpeg")
    {
        var normalizedObjectPath = objectPath.TrimStart('/').Replace('\\', '/');
        using var ms = new MemoryStream();
        await contentStream.CopyToAsync(ms);
        var bytes = ms.ToArray();

        using var sha = SHA256.Create();
        var sha256Hash = Convert.ToHexString(sha.ComputeHash(bytes)).ToLowerInvariant();

        // Save verified local mirror under wwwroot/storage/{bucket}/{objectPath}
        var webRoot = GetWebRootPath();
        var relativeStoragePath = $"storage/{_storageBucket}/{normalizedObjectPath}";
        var physicalPath = Path.Combine(webRoot, relativeStoragePath.Replace('/', Path.DirectorySeparatorChar));
        var dir = Path.GetDirectoryName(physicalPath);
        if (!string.IsNullOrWhiteSpace(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }
        await File.WriteAllBytesAsync(physicalPath, bytes);

        var publicUrl = $"{_supabaseUrl}/storage/v1/object/public/{_storageBucket}/{normalizedObjectPath}";
        var localFileUrl = $"/{relativeStoragePath}";
        bool uploadedRemote = false;
        string? remoteMessage = null;

        if (IsRemoteStorageConfigured)
        {
            try
            {
                var uploadEndpoint = $"{_supabaseUrl}/storage/v1/object/{_storageBucket}/{normalizedObjectPath}";
                using var req = new HttpRequestMessage(HttpMethod.Post, uploadEndpoint);
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
                req.Headers.Add("apikey", _serviceRoleKey);
                req.Headers.Add("x-upsert", "true");
                req.Content = new ByteArrayContent(bytes);
                req.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

                var resp = await _httpClient.SendAsync(req);
                if (resp.IsSuccessStatusCode)
                {
                    uploadedRemote = true;
                    remoteMessage = "Uploaded to Supabase Storage bucket.";
                }
                else
                {
                    remoteMessage = $"Supabase Storage HTTP {(int)resp.StatusCode}";
                }
            }
            catch (Exception ex)
            {
                remoteMessage = $"Supabase Storage upload exception: {ex.Message}";
            }
        }
        else
        {
            remoteMessage = "SUPABASE_SERVICE_ROLE_KEY not configured; stored in local storage mirror and recorded metadata in Supabase PostgreSQL.";
        }

        return new SupabaseStorageUploadResult
        {
            UploadedToRemoteBucket = uploadedRemote,
            StorageBucket = _storageBucket,
            ObjectPath = normalizedObjectPath,
            FileUrl = localFileUrl,
            PublicUrl = publicUrl,
            Sha256Hash = sha256Hash,
            SizeBytes = bytes.Length,
            RemoteStatusMessage = remoteMessage
        };
    }

    public string? ResolvePhysicalAudioPath(string? fileUrl, string? objectPath)
    {
        var webRoot = GetWebRootPath();

        if (!string.IsNullOrWhiteSpace(objectPath))
        {
            var normalizedObj = objectPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var candidateStorage = Path.Combine(webRoot, "storage", _storageBucket, normalizedObj);
            if (File.Exists(candidateStorage))
            {
                return candidateStorage;
            }
        }

        if (!string.IsNullOrWhiteSpace(fileUrl) && !fileUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            var cleanUrl = fileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var candidate = Path.Combine(webRoot, cleanUrl);
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }

    private static string GetWebRootPath()
    {
        var current = Directory.GetCurrentDirectory();
        var directWwwroot = Path.Combine(current, "wwwroot");
        if (Directory.Exists(directWwwroot))
        {
            return directWwwroot;
        }
        var apiWwwroot = Path.Combine(current, "src", "API", "wwwroot");
        if (Directory.Exists(apiWwwroot))
        {
            return apiWwwroot;
        }
        Directory.CreateDirectory(directWwwroot);
        return directWwwroot;
    }
}
