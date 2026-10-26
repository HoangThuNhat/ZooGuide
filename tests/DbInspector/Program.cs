using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Npgsql;

class Program
{
    static async Task Main()
    {
        string? pgConnStr = null;
        var envPath = File.Exists(".env") ? ".env" : Path.Combine("..", "..", ".env");
        if (File.Exists(envPath))
        {
            foreach (var line in File.ReadAllLines(envPath))
            {
                if (line.StartsWith("SUPABASE_CONNECTION_STRING="))
                {
                    pgConnStr = line.Substring("SUPABASE_CONNECTION_STRING=".Length).Trim();
                    break;
                }
            }
        }
        using var conn = new NpgsqlConnection(pgConnStr);
        conn.Open();

        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };

        Console.WriteLine("=== VERIFYING ALL 28 POI AUDIOS IN DATABASE ===");
        int total = 0;
        int valid = 0;
        int invalid = 0;

        using (var cmd = new NpgsqlCommand(@"
            SELECT pn.""PoiNarrationId"", p.""Code"", p.""Name"", l.""Code"" as Lang, pn.""AudioUrl"", pn.""DurationSeconds""
            FROM ""POI_NARRATIONS"" pn
            JOIN ""POINTS_OF_INTEREST"" p ON pn.""PoiId"" = p.""PoiId""
            JOIN ""LANGUAGES"" l ON pn.""LanguageId"" = l.""LanguageId""
            ORDER BY pn.""PoiNarrationId"";", conn))
        using (var r = cmd.ExecuteReader())
        {
            while (r.Read())
            {
                total++;
                int id = r.GetInt32(0);
                string code = r.GetString(1);
                string name = r.GetString(2);
                string lang = r.GetString(3);
                string? url = r.IsDBNull(4) ? null : r.GetString(4);
                int dur = r.IsDBNull(5) ? 0 : r.GetInt32(5);

                if (string.IsNullOrWhiteSpace(url))
                {
                    Console.WriteLine($"[FAIL] POI #{id} [{code}] ({lang}): URL is NULL");
                    invalid++;
                    continue;
                }

                try
                {
                    var resp = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead);
                    if (!resp.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"[FAIL] POI #{id} [{code}] ({lang}): HTTP {(int)resp.StatusCode}");
                        invalid++;
                    }
                    else
                    {
                        var s = await resp.Content.ReadAsStreamAsync();
                        byte[] buf = new byte[4];
                        int bytesRead = await s.ReadAsync(buf, 0, 4);
                        bool isMp3 = bytesRead >= 3 && (
                            (buf[0] == 0x49 && buf[1] == 0x44 && buf[2] == 0x33) ||
                            (buf[0] == 0xFF && (buf[1] & 0xE0) == 0xE0)
                        );
                        if (isMp3)
                        {
                            valid++;
                            Console.WriteLine($"[OK] POI #{id} [{code}] ({lang}) - Dur={dur}s - Valid MP3");
                        }
                        else
                        {
                            Console.WriteLine($"[FAIL] POI #{id} [{code}] ({lang}): Bad MP3 header");
                            invalid++;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[FAIL] POI #{id} [{code}] ({lang}): {ex.Message}");
                    invalid++;
                }
            }
        }

        Console.WriteLine($"\n=== POI AUDIO VERIFICATION RESULT: Total={total}, Valid={valid}, Invalid={invalid} ===");
    }
}
