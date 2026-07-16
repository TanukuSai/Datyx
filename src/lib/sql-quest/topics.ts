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
    name: "SQL Basics & Filtering",
    description: "Learn how to query tables and filter rows based on specific conditions.",
    levelsRange: "Levels 1–5",
    levelIds: [1, 2, 3, 4, 5],
    learningResources: {
      theory: "Relational databases store data in tables. A table consists of columns (fields) and rows (records). To retrieve data, we use the `SELECT` statement. The `FROM` clause specifies the table. We can filter results using the `WHERE` clause with comparison operators (like `=`, `>`, `<`, `!=`).",
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
    id: "topic_2",
    name: "Sorting, Duplicates & Ranges",
    description: "Sort records, limit output sizes, retrieve unique lists, and search ranges.",
    levelsRange: "Levels 6–8",
    levelIds: [6, 7, 8],
    learningResources: {
      theory: "Use `ORDER BY` to sort records (default ascending, use `DESC` for descending). Limit output sizes with `LIMIT`. Retrieve unique/non-duplicate values with `DISTINCT`. Use `BETWEEN` to search value ranges (inclusive) and `LIKE` with wildcards (`%`) for pattern matching.",
      examples: [
        {
          sql: "SELECT DISTINCT city FROM users;",
          explanation: "Finds all unique cities represented in the users table."
        },
        {
          sql: "SELECT * FROM products WHERE price BETWEEN 1000 AND 5000 ORDER BY price DESC LIMIT 3;",
          explanation: "Returns the 3 most expensive products priced between 1,000 and 5,000."
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
    id: "topic_3",
    name: "Aggregates & Grouping",
    description: "Perform mathematical calculations across rows and group summaries.",
    levelsRange: "Levels 9–12",
    levelIds: [9, 10, 11, 12],
    learningResources: {
      theory: "Aggregate functions perform calculations on multiple rows: `COUNT()` (total items), `SUM()` (total sum), `AVG()` (average value), `MIN()`, and `MAX()`. Group rows using `GROUP BY`. Filter aggregated results using `HAVING` (you cannot use `WHERE` on aggregate totals).",
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
  },
  {
    id: "topic_4",
    name: "Multi-table Joins",
    description: "Combine information from multiple tables using primary and foreign keys.",
    levelsRange: "Levels 13–14",
    levelIds: [13, 14],
    learningResources: {
      theory: "Normalized databases split data across tables. Use `JOIN` (or `INNER JOIN`) to combine rows with matches in both tables. Use `LEFT JOIN` to return all rows from the left table and matching rows from the right table (unmatched columns will contain `NULL`). Define match rules with `ON`.",
      examples: [
        {
          sql: "SELECT u.name, o.amount FROM users u INNER JOIN orders o ON o.user_id = u.id;",
          explanation: "Combines users and orders, listing order amounts alongside the user's name."
        },
        {
          sql: "SELECT u.name, o.amount FROM users u LEFT JOIN orders o ON o.user_id = u.id;",
          explanation: "Lists every user, including users with no orders (whose amount will show as NULL)."
        }
      ],
      practice: {
        question: "How would you join products and categories tables to list product names alongside category names?",
        sql: "SELECT p.name, c.name FROM products p INNER JOIN categories c ON p.category_id = c.id;",
        explanation: "Joins products (p) to categories (c) using the category foreign key mapping."
      }
    }
  },
  {
    id: "topic_5",
    name: "Advanced & Window Functions",
    description: "Implement conditional branching, subqueries, CTEs, and row ranking.",
    levelsRange: "Levels 15–20",
    levelIds: [15, 16, 17, 18, 19, 20],
    learningResources: {
      theory: "Write conditional checks with `CASE WHEN`. Put queries inside queries (subqueries). Create temporary named result sets with Common Table Expressions (`WITH name AS ...`). Use window functions like `ROW_NUMBER() OVER(PARTITION BY ... ORDER BY ...)` to perform row-by-row comparisons.",
      examples: [
        {
          sql: "SELECT name, CASE WHEN score >= 50 THEN 'Pass' ELSE 'Fail' END AS result FROM exam_scores;",
          explanation: "Uses conditional logic to label results as Pass or Fail based on the score."
        },
        {
          sql: "SELECT name, salary, ROW_NUMBER() OVER(ORDER BY salary DESC) as rank FROM employees;",
          explanation: "Computes a numeric rank for each employee sorted by salary from highest to lowest."
        }
      ],
      practice: {
        question: "How do you define a Common Table Expression (CTE) to fetch orders above 500 first, and select from it?",
        sql: "WITH large_orders AS (SELECT * FROM orders WHERE amount > 500) SELECT * FROM large_orders;",
        explanation: "The WITH clause defines the CTE expression block, which is then queried directly in the main query."
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
