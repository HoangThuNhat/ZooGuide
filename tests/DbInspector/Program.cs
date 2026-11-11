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

        Console.WriteLine("\n=== CURRENT USERS IN DATABASE ===");
        using (var cmd = new NpgsqlCommand(@"
            SELECT ""UserId"", ""Username"", ""Email"", ""FullName"", ""Role"", ""Status"", ""PasswordHash"", ""LastLoginAt""
            FROM ""USERS""
            ORDER BY ""UserId"";", conn))
        using (var r = cmd.ExecuteReader())
        {
            while (r.Read())
            {
                int id = r.GetInt32(0);
                string username = r.GetString(1);
                string email = r.GetString(2);
                string fullName = r.GetString(3);
                string role = r.GetString(4);
                string status = r.GetString(5);
                string hash = r.GetString(6);
                string lastLogin = r.IsDBNull(7) ? "Never" : r.GetDateTime(7).ToString("yyyy-MM-dd HH:mm:ss");

                Console.WriteLine($"ID: {id} | User: '{username}' | Email: '{email}' | Role: '{role}' | Status: '{status}' | LastLogin: {lastLogin}");
                Console.WriteLine($"   Hash: {hash}");
            }
        }
    }
}
