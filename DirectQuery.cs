using System;
using Npgsql;

class Program
{
    static void Main()
    {
        string pgConnStr = "Host=aws-0-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.mqawjvhflseqjjapegfk;Password=UkAf_e#J4CNV+AE;SSL Mode=Require;Trust Server Certificate=true;";
        using var pgConn = new NpgsqlConnection(pgConnStr);
        pgConn.Open();
        
        using var cmd = new NpgsqlCommand("SELECT \"TicketTypeId\", \"Name\", \"Price\" FROM \"TICKET_TYPES\" WHERE \"TicketTypeId\" = 1006", pgConn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"Found in Supabase: ID={reader.GetInt32(0)}, Name={reader.GetString(1)}, Price={reader.GetDecimal(2)}");
        }
    }
}
