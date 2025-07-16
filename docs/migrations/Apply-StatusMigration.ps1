# Enhanced Event Status Management Migration Script (PowerShell)
# This script applies the database migration for the new status management system

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "beout_db",
    [string]$DbUser = "postgres"
)

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )

    $colors = @{
        "Red"    = "Red"
        "Green"  = "Green"
        "Yellow" = "Yellow"
        "White"  = "White"
    }

    Write-Host $Message -ForegroundColor $colors[$Color]
}

Write-ColorOutput "Starting Enhanced Event Status Management Migration..." "Yellow"

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
}
catch {
    Write-ColorOutput "Error: psql command not found. Please install PostgreSQL client." "Red"
    exit 1
}

# Migration file path
$MigrationFile = Join-Path $PSScriptRoot "008_enhanced_event_status_management.sql"

if (-not (Test-Path $MigrationFile)) {
    Write-ColorOutput "Error: Migration file not found at $MigrationFile" "Red"
    exit 1
}

Write-ColorOutput "Migration file found: $MigrationFile" "Yellow"

# Create backup
Write-ColorOutput "Creating database backup..." "Yellow"
$BackupFile = "backup_before_status_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

try {
    & pg_dump -h $DbHost -p $DbPort -U $DbUser $DbName | Out-File -FilePath $BackupFile -Encoding UTF8
    Write-ColorOutput "Backup created: $BackupFile" "Green"
}
catch {
    Write-ColorOutput "Warning: Failed to create backup. Continuing with migration..." "Yellow"
}

# Apply migration
Write-ColorOutput "Applying migration..." "Yellow"

try {
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $MigrationFile

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "Migration completed successfully!" "Green"

        # Verify migration
        Write-ColorOutput "Verifying migration..." "Yellow"

        # Check if new columns exist
        $newColumnsQuery = @"
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('is_published', 'status_changed_at', 'status_changed_by');
"@

        $newColumns = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c $newColumnsQuery | Measure-Object | Select-Object -ExpandProperty Count

        if ($newColumns -eq 3) {
            Write-ColorOutput "✓ New columns added successfully" "Green"
        }
        else {
            Write-ColorOutput "✗ Some columns may be missing" "Red"
        }

        # Check if new table exists
        $statusHistoryQuery = @"
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_name = 'event_status_history';
"@

        $statusHistoryTable = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c $statusHistoryQuery

        if ($statusHistoryTable.Trim() -eq "1") {
            Write-ColorOutput "✓ Event status history table created" "Green"
        }
        else {
            Write-ColorOutput "✗ Event status history table not found" "Red"
        }

        # Check if triggers exist
        $triggersQuery = @"
SELECT COUNT(*)
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_log_event_status_change', 'trigger_notify_event_status_change');
"@

        $triggers = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c $triggersQuery

        if ($triggers.Trim() -eq "2") {
            Write-ColorOutput "✓ Status change triggers created" "Green"
        }
        else {
            Write-ColorOutput "✗ Some triggers may be missing" "Red"
        }

        Write-ColorOutput "Migration verification completed!" "Green"
        Write-ColorOutput "Next steps:" "Yellow"
        Write-Host "1. Update your application code to use the new status management system"
        Write-Host "2. Test the new functionality in a development environment"
        Write-Host "3. Update your frontend components to use the new status workflow"
        Write-Host "4. Train your team on the new event management process"

    }
    else {
        Write-ColorOutput "Migration failed! Check the error messages above." "Red"
        Write-ColorOutput "You can restore from backup if needed: $BackupFile" "Yellow"
        exit 1
    }
}
catch {
    Write-ColorOutput "Migration failed with exception: $($_.Exception.Message)" "Red"
    exit 1
}
