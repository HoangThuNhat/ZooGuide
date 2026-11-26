using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZooGuide.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPasswordChangedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordChangedAt",
                table: "USERS",
                type: "timestamp with time zone",
                nullable: true);

            // Backfill PasswordChangedAt using CreatedAt for existing Admin and Staff accounts
            migrationBuilder.Sql(@"
                UPDATE ""USERS""
                SET ""PasswordChangedAt"" = ""CreatedAt""
                WHERE ""PasswordChangedAt"" IS NULL
                  AND ""Role"" IN ('Admin', 'Staff');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordChangedAt",
                table: "USERS");
        }
    }
}
