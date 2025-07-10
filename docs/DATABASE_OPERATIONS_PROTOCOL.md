# DATABASE OPERATIONS PROTOCOL - Be Out Project

## 🔒 MANDATORY RULE: NO DIRECT DATABASE MODIFICATIONS

### **PROTOCOL ENFORCED:**

1. **AI Assistant Role:**
   - ✅ **CAN**: Generate SQL statements and provide them as text
   - ✅ **CAN**: Analyze database schema and suggest improvements
   - ✅ **CAN**: Create migration scripts and data insertion queries
   - ❌ **CANNOT**: Execute any database operations directly
   - ❌ **CANNOT**: Modify database files or run SQL commands

2. **Human Developer Role:**
   - ✅ **MUST**: Review all SQL statements before execution
   - ✅ **MUST**: Execute SQL statements manually in database console
   - ✅ **MUST**: Verify results and report back to AI
   - ✅ **MUST**: Handle database backups and recovery

### **WORKFLOW:**

```
1. AI generates SQL → 2. Human reviews SQL → 3. Human executes in DB console → 4. Human confirms results
```

### **SQL STATEMENT FORMAT:**

All database operations will be provided as:

```sql
-- OPERATION: [Description of what this does]
-- TABLE(S): [Tables affected]
-- SAFETY: [Any precautions needed]

[SQL STATEMENT HERE]
```

### **SAFETY MEASURES:**

- All `UPDATE` and `DELETE` statements will include `WHERE` clauses
- Backup recommendations provided for destructive operations
- Step-by-step execution order specified
- Rollback statements provided when applicable

---

## 📋 **CURRENT DATABASE SETUP:**

Before implementing events, please confirm:

1. **Database Type**: PostgreSQL/MySQL/SQLite?
2. **Connection Details**: Host, port, database name
3. **Current Tables**: What tables already exist?
4. **Admin Access**: Do you have full database admin rights?

---

**This protocol ensures database integrity and human oversight of all data operations.**
