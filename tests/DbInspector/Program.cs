using System;
using System.IO;
using Npgsql;

class Program
{
    static void Main()
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
        if (string.IsNullOrWhiteSpace(pgConnStr))
        {
            pgConnStr = Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING");
        }

        using var conn = new NpgsqlConnection(pgConnStr);
        conn.Open();

        using var c1 = new NpgsqlCommand("SELECT count(*) FROM \"ANIMALS\";", conn);
        using var c2 = new NpgsqlCommand("SELECT count(*) FROM \"NARRATIONS\";", conn);
        using var c3 = new NpgsqlCommand("SELECT count(*) FROM \"AUDIOS\";", conn);
        using var c4 = new NpgsqlCommand("SELECT count(*) FROM \"CONTENT_TRANSLATIONS\";", conn);

        Console.WriteLine("Database Counts in Supabase PostgreSQL:");
        Console.WriteLine($" - ANIMALS: {c1.ExecuteScalar()}");
        Console.WriteLine($" - NARRATIONS: {c2.ExecuteScalar()}");
        Console.WriteLine($" - AUDIOS: {c3.ExecuteScalar()}");
        Console.WriteLine($" - CONTENT_TRANSLATIONS: {c4.ExecuteScalar()}");

        Console.WriteLine("\nSample AUDIOS records in Supabase PostgreSQL:");
        using var cmd = new NpgsqlCommand("SELECT \"AudioId\", \"NarrationId\", \"LanguageCode\", \"ObjectPath\", \"PublicUrl\" FROM \"AUDIOS\" ORDER BY \"AudioId\" LIMIT 5;", conn);
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            Console.WriteLine($" - AudioId={r.GetInt32(0)} | NarrId={r.GetInt32(1)} | Lang={r.GetString(2)} | Path={r.GetString(3)} | Url={r.GetString(4)}");
        }
    }
}
