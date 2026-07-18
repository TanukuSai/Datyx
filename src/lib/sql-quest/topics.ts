export interface TopicExample {
  sql: string;
  explanation: string;
}

export interface TopicPractice {
  question: string;
  sql: string;
  explanation: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  levelsRange: string;
  levelIds: number[];
  learningResources: {
    theory: string;
    examples: TopicExample[];
    practice: TopicPractice;
  };
}

export const TOPICS: Topic[] = [
  {
    id: "topic_1",
    name: "DDL & DML Commands",
    description: "Learn to build database tables, insert rows, update records, and delete rows.",
    levelsRange: "Levels 1–4",
    levelIds: [1, 2, 3, 4],
    learningResources: {
      theory: `### 1. Data Definition Language (DDL)
Data Definition Language (DDL) includes commands that define and modify the schema of your database tables.
- **CREATE TABLE:** Initializes a brand new table. You must supply a table name and define columns with their matching types:
  \`CREATE TABLE students (id INTEGER, name TEXT);\`
- **Data Types:** Common SQLite data types include \`INTEGER\` (numbers), \`TEXT\` (strings/text), and \`REAL\` (floats/decimals).

### 2. Data Manipulation Language (DML)
Data Manipulation Language (DML) includes commands used to modify and manage rows of data inside tables.
- **INSERT INTO:** Adds a new row of data. Value order must align with the columns:
  \`INSERT INTO students VALUES (1, 'Rohan');\`
- **UPDATE:** Edits existing rows. Use a \`SET\` statement for values and a \`WHERE\` statement to isolate target records:
  \`UPDATE students SET name = 'Rohan Sharma' WHERE id = 1;\`
- **DELETE:** Removes rows from a table using a filtering condition:
  \`DELETE FROM students WHERE id = 2;\`

⚠️ **CRITICAL CAUTION:** Always specify a \`WHERE\` filter on \`UPDATE\` and \`DELETE\` commands. If you omit it, the operation will affect **every single row** in your table!`,
      examples: [
        {
          sql: "CREATE TABLE books (id INTEGER, title TEXT);",
          explanation: "Creates a new table named books with numeric id and textual title columns."
        },
        {
          sql: "UPDATE products SET price = 50 WHERE id = 4;",
          explanation: "Changes the price of product ID 4 to 50."
        }
      ],
      practice: {
        question: "How do you delete a product with ID 10 from the products table?",
        sql: "DELETE FROM products WHERE id = 10;",
        explanation: "The DELETE command with a WHERE clause removes only the matching row."
      }
    }
  },
  {
    id: "topic_2",
    name: "SQL Basics & Filtering",
    description: "Learn how to query tables and filter rows based on specific conditions.",
    levelsRange: "Levels 5–9",
    levelIds: [5, 6, 7, 8, 9],
    learningResources: {
      theory: `### 1. The SELECT and FROM Clause
To retrieve data, you use the \`SELECT\` statement, which defines *which* columns to show. The \`FROM\` clause specifies *which* table to retrieve them from:
- \`SELECT * FROM users;\` retrieves **every column** and row.
- \`SELECT name, city FROM users;\` retrieves only the **name** and **city** columns, discarding all other attributes.

### 2. Filtering Rows with WHERE
The \`WHERE\` clause acts as a filter, retaining only the rows that satisfy a specific logical condition:
- **Comparison Operators:** You filter data using standard operators:
  - \`=\` (Equal to)
  - \`!=\` or \`<>\` (Not equal to)
  - \`>\`, \`<\` (Greater than, Less than)
  - \`>=\`, \`<=\` (Greater than or equal to, Less than or equal to)
- **Strings vs Numbers:** Numeric values are written directly (e.g., \`price > 1000\`), while string text values **must be enclosed in single quotes** (e.g., \`city = 'Mumbai'\`). Single quotes are a strict SQL standard.

### 3. Combining Conditions (Boolean Logic)
You can build complex filtering rules by combining conditions:
- \`AND\`: Evaluates to true only if **both** conditions are true (e.g., \`price > 100 AND price < 500\`).
- \`OR\`: Evaluates to true if **either** condition is true (e.g., \`city = 'Mumbai' OR city = 'Delhi'\`).
- \`NOT\`: Negates a condition (e.g., \`NOT city = 'Pune'\`).`,
      examples: [
        {
          sql: "SELECT * FROM users;",
          explanation: "Retrieves all columns and rows from the users table."
        },
        {
          sql: "SELECT name, city FROM users WHERE city = 'Delhi';",
          explanation: "Retrieves name and city for users residing in Delhi."
        }
      ],
      practice: {
        question: "How would you query names and cities of users who do NOT live in Mumbai?",
        sql: "SELECT name, city FROM users WHERE city != 'Mumbai';",
        explanation: "The `!=` (or `<>`) operator filters out users whose city is Mumbai."
      }
    }
  },
  {
    id: "topic_3",
    name: "Sorting, Duplicates & Pattern Matching",
    description: "Sort records, limit output sizes, retrieve unique lists, and search patterns.",
    levelsRange: "Levels 10–11",
    levelIds: [10, 11],
    learningResources: {
      theory: `### 1. Sorting Results with ORDER BY
By default, database query results are returned in an arbitrary order. To sort your output, use the \`ORDER BY\` clause followed by the column name:
- **Ascending (ASC):** Sorts smallest-to-largest or A-to-Z. This is the default setting (e.g., \`ORDER BY price;\` is same as \`ORDER BY price ASC;\`).
- **Descending (DESC):** Sorts largest-to-smallest or Z-to-A (e.g., \`ORDER BY price DESC;\`).
- **Multiple Columns:** You can sort by one column, and resolve ties using a second column (e.g., \`ORDER BY city ASC, name DESC;\`).

### 2. Restricting Output with LIMIT
The \`LIMIT\` clause is appended at the very end of a query to restrict the number of rows returned. It is extremely useful for optimization or fetching rankings (e.g., "Top 3 highest items"):
- \`SELECT * FROM products ORDER BY price DESC LIMIT 3;\` sorts products from highest to lowest price and returns only the first three rows.

### 3. Unique Records with DISTINCT
If a column contains duplicate values and you want to retrieve a clean, unique list of entries, prepend the column list with \`DISTINCT\`:
- \`SELECT DISTINCT city FROM users;\` returns each city represented in the users table exactly once, eliminating duplicate rows.

### 4. Pattern Matching with LIKE
The \`LIKE\` operator performs simple wildcard comparisons, usually on text columns:
- \`%\` (Percent wildcard): Represents **any number of characters** (including zero).
  - \`LIKE 'A%'\` matches anything starting with 'A' (e.g., 'Aditi', 'Aligarh').
  - \`LIKE '%gmail.com'\` matches text ending with '@gmail.com'.
  - \`LIKE '%sql%'\` matches text containing 'sql' anywhere.
- \`_\` (Underscore wildcard): Represents **exactly one character** (e.g., \`LIKE 'J_n'\` matches 'Jon' and 'Jan', but not 'John').`,
      examples: [
        {
          sql: "SELECT DISTINCT city FROM users;",
          explanation: "Finds all unique cities represented in the users table."
        },
        {
          sql: "SELECT * FROM products WHERE price ORDER BY price DESC LIMIT 3;",
          explanation: "Returns the 3 most expensive products."
        }
      ],
      practice: {
        question: "How do you query users whose email addresses end with '@datyx.club'?",
        sql: "SELECT * FROM users WHERE email LIKE '%@datyx.club';",
        explanation: "The `%` wildcard matches any characters preceding the specified domain suffix."
      }
    }
  },
  {
    id: "topic_4",
    name: "Aggregates & Grouping",
    description: "Perform mathematical calculations across rows and group summaries.",
    levelsRange: "Levels 12–14",
    levelIds: [12, 13, 14],
    learningResources: {
      theory: `### 1. Aggregate Functions
Aggregates process columns across multiple rows to return a single computed summary value:
- \`COUNT(column)\` / \`COUNT(*)\`: \`COUNT(*)\` counts every row, including null values. \`COUNT(column)\` counts only rows where that specific column is not NULL.
- \`SUM(column)\`: Calculates the mathematical sum of numeric values.
- \`AVG(column)\`: Calculates the arithmetic mean.
- \`MIN(column)\` and \`MAX(column)\`: Retrieves the smallest and largest values.
- **Column Aliasing:** Prepend result headers with \`AS\` to make them clean (e.g., \`SELECT COUNT(*) AS total_records\`).

### 2. Grouping Rows with GROUP BY
The \`GROUP BY\` clause splits your data table into buckets/groups based on matching column values, then applies aggregate functions to each group separately:
- If you run: \`SELECT city, COUNT(*) FROM users GROUP BY city;\`
  1. The database groups rows into matching city buckets.
  2. It runs the \`COUNT(*)\` calculation inside each city bucket separately.
- **Golden Rule:** Every non-aggregated column in your \`SELECT\` clause **must** be listed inside the \`GROUP BY\` clause (e.g., if you select \`city\`, you must group by \`city\`).

### 3. Filtering Summaries with HAVING
The \`WHERE\` clause filters individual source rows *before* they are grouped or aggregated. It cannot look at aggregate scores (e.g., \`WHERE COUNT(*) > 5\` is invalid).
- To filter groups *after* aggregation, you **must** use the \`HAVING\` clause:
  - \`SELECT city, COUNT(*) FROM users GROUP BY city HAVING COUNT(*) > 10;\` (returns only cities with more than 10 users).`,
      examples: [
        {
          sql: "SELECT COUNT(*) AS total_orders FROM orders;",
          explanation: "Returns the total count of order rows as a single column named total_orders."
        },
        {
          sql: "SELECT user_id, SUM(amount) FROM orders GROUP BY user_id HAVING SUM(amount) > 1000;",
          explanation: "Groups orders by user and filters for users who spent more than 1,000 in total."
        }
      ],
      practice: {
        question: "How do you calculate the average age of users grouped by city, showing only cities with an average age above 20?",
        sql: "SELECT city, AVG(age) FROM users GROUP BY city HAVING AVG(age) > 20;",
        explanation: "Use GROUP BY city to aggregate ages and HAVING to filter based on the average."
      }
    }
  }
];

export function getTopicByLevelId(levelId: number): Topic | undefined {
  return TOPICS.find((t) => t.levelIds.includes(levelId));
}

export function isTopicUnlocked(topicId: string, maxActiveTopicId: string): boolean {
  const index = TOPICS.findIndex((t) => t.id === topicId);
  const activeIndex = TOPICS.findIndex((t) => t.id === maxActiveTopicId);
  if (index === -1) return false;
  if (activeIndex === -1) return topicId === "topic_1"; // Default fallback
  return index <= activeIndex;
}
