using System;
using System.IO;
using Npgsql;

class Program
{
    static void Main(string[] args)
    {
        string? connStr = Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connStr))
        {
            var envPath = File.Exists(".env") ? ".env" : Path.Combine("..", "..", ".env");
            if (File.Exists(envPath))
            {
                foreach (var line in File.ReadAllLines(envPath))
                {
                    if (line.StartsWith("SUPABASE_CONNECTION_STRING="))
                    {
                        connStr = line.Substring("SUPABASE_CONNECTION_STRING=".Length).Trim();
                        break;
                    }
                }
            }
        }
        if (string.IsNullOrWhiteSpace(connStr))
        {
            throw new InvalidOperationException("Missing SUPABASE_CONNECTION_STRING environment variable.");
        }
        using var conn = new NpgsqlConnection(connStr);
        conn.Open();

        using var tran = conn.BeginTransaction();
        try
        {
            // 1. Spaced-out Coordinates for Area 7 and Enclosures 2, 3, 7
            // Area 7 (Khu Động Vật Ăn Thịt): Center (550, 130)
            using (var cmd = new NpgsqlCommand(@"
                UPDATE ""AREAS""
                SET ""MapX"" = 550, ""MapY"" = 130
                WHERE ""AreaId"" = 7;
            ", conn, tran))
            {
                cmd.ExecuteNonQuery();
            }

            // Enclosure 2: Chuồng Hổ Bengal -> (470, 110)
            using (var cmd = new NpgsqlCommand(@"
                UPDATE ""ENCLOSURES""
                SET ""MapX"" = 470, ""MapY"" = 110
                WHERE ""EnclosureId"" = 2;
            ", conn, tran))
            {
                cmd.ExecuteNonQuery();
            }

            // Enclosure 3: Chuồng Hổ Siberia -> (550, 140)
            using (var cmd = new NpgsqlCommand(@"
                UPDATE ""ENCLOSURES""
                SET ""MapX"" = 550, ""MapY"" = 140
                WHERE ""EnclosureId"" = 3;
            ", conn, tran))
            {
                cmd.ExecuteNonQuery();
            }

            // Enclosure 7: Chuồng Sư Tử Hoàng Gia -> (630, 110)
            using (var cmd = new NpgsqlCommand(@"
                UPDATE ""ENCLOSURES""
                SET ""MapX"" = 630, ""MapY"" = 110
                WHERE ""EnclosureId"" = 7;
            ", conn, tran))
            {
                cmd.ExecuteNonQuery();
            }

            tran.Commit();
            Console.WriteLine("Successfully updated spaced-out coordinates for Area 7 and Enclosures 2, 3, 7.");
        }
        catch (Exception ex)
        {
            tran.Rollback();
            Console.WriteLine("Error: " + ex.Message);
            throw;
        }

        // Print final status
        Console.WriteLine("\n=== CURRENT ENCLOSURES ===");
        using (var cmd = new NpgsqlCommand(@"SELECT ""EnclosureId"", ""AreaId"", ""Code"", ""Name"", ""MapX"", ""MapY"" FROM ""ENCLOSURES"" ORDER BY ""EnclosureId"";", conn))
        using (var r = cmd.ExecuteReader())
        {
            while (r.Read())
            {
                Console.WriteLine($"EnclosureId: {r.GetInt32(0)} | AreaId: {r.GetInt32(1)} | Code: {r.GetString(2)} | Name: {r.GetString(3)} | X: {r.GetValue(4)} | Y: {r.GetValue(5)}");
            }
        }
    }
}
