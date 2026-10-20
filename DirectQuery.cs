using System;
using System.IO;
using Npgsql;

class Program
{
    static void Main()
    {
        string? pgConnStr = Environment.GetEnvironmentVariable("SUPABASE_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(pgConnStr) && File.Exists(".env"))
        {
            foreach (var line in File.ReadAllLines(".env"))
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
            throw new InvalidOperationException("Missing SUPABASE_CONNECTION_STRING environment variable.");
        }

        using var pgConn = new NpgsqlConnection(pgConnStr);
        pgConn.Open();
        
        using var cmd = new NpgsqlCommand("SELECT \"TicketTypeId\", \"Name\", \"Price\" FROM \"TICKET_TYPES\" ORDER BY \"TicketTypeId\"", pgConn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"Found in Supabase: ID={reader.GetInt32(0)}, Name={reader.GetString(1)}, Price={reader.GetDecimal(2)}");
        }
    }
}
