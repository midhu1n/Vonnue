# Build Process

## 1) How you started
I initiated this project using a dual-track development approach, tackling the user experience and the core logic simultaneously.

- Track 1 (The Algorithm): I began by researching Multi-Criteria Decision Analysis (MCDA) systems. I needed an algorithm that was mathematically sound but also easily explainable to the end-user. I mapped out the logic for a Weighted Sum Model (WSM).

- Track 2 (The Interface): In parallel, I designed the home page and established a strict monochromatic "Spatial UI" (DESIGN_SYSTEM.md). Because decision-making matrices are data-heavy, I knew a clean, low-cognitive-load UI was essential before writing any complex React state logic.

Tech Stack Selection: I went with **Next.js** and **Tailwind CSS** for the frontend because they let me build the UI fast. For the backend, I used **Django Framework**
 

## 2) How your thinking evolved
Initially, when I read "Decision Companion," my instinct was to build a chatbot wrapper around the OpenAI/Gemini API and just pass the user's options to an LLM to pick a winner.

However, as I analyzed the constraints—specifically "Your logic should be explainable (not a black box)"—my thinking completely pivoted. I realized an LLM is the ultimate black box. It cannot do reliable weighted arithmetic, and it hallucinates. I evolved my architecture to use a deterministic mathematical engine for the actual decision-making, limiting any AI usage strictly to natural language formatting or UI assistance, rather than the calculation itself.

My focus then shifted from simply capturing the decision query to building a mathematically sound evaluation engine. It became clear I needed two major structural components:
1. **A highly explainable decision logic:** This led me to explore and ultimately select the **Weighted Sum Model (WSM)** over more complex algorithms like TOPSIS, prioritizing absolute transparency for the final user calculation.
2. **A robust Normalization strategy:** I realized I cannot directly compare "Price" (where lower is better) with "Performance" (where higher is better). To translate varied units into a unified `0.0` to `1.0` scale, I evolved my thinking from attempting basic Linear Scaling (which fails without domain knowledge) to Standard Min-Max, and finally to engineering a **Custom Guarded Min-Max algorithm** to overcome critical mathematical vulnerabilities.

## 3) Alternative approaches considered

### Decision Engine Logic (WSM vs. TOPSIS)
When transitioning to a mathematical engine, I needed an algorithm that was robust but highly explainable. 

- **TOPSIS (Ideal Solution):** I also considered TOPSIS because it is excellent at finding the "most balanced" option by measuring the Euclidean distance to theoretical ideal points. However, I ultimately dropped this approach. The math involved (vector normalization, distance calculations) is moderately complex to implement and, more importantly, extremely difficult to concisely explain to a non-technical end user.
- **WSM (Weighted Sum Model):** I pivoted to WSM as the main decision logic. It is significantly less complex to implement, and its linear trade-offs (score × weight) provide the absolute highest transparency. This completely satisfied the core prompt requirement for an "explainable" system.

### Normalization Strategies
One of the main challenges of building a generic engine is data asymmetry—comparing "Price" (where lower is better) directly with "Performance" (where higher is better). I evaluated three distinct approaches to standardize these units into a unified `0.0` to `1.0` scale.

#### 1. Linear Scale Approach
First, I tried to implement a **Linear Scale**. This approach sets absolute, domain-specific boundaries (e.g., scoring a laptop out of a theoretical maximum of 100). 
- **The Verdict:** It is easy to calculate and mathematically safe, but it is entirely unsuitable for generic comparison systems. It relies on hardcoded domain expertise. The engine could not mathematically understand if "10" was a good score for "Miles per Gallon" or a terrible score for "Square Footage."

#### 2. Standard Min-Max Normalization
Second, I pivoted to **Min-Max Normalization**. This relative approach dynamically evaluates the actual group of items entered by the user, assigning a `1.0` to the best available option and a `0.0` to the worst.
- **The Verdict:** It is fantastic for generic systems because it requires zero domain knowledge. However, I discovered it had catastrophic mathematical fallbacks:
  - **Division by Zero:** If all values in the dataset are identical, the engine crashes.
  - **Outlier Compression:** A single extreme outlier (like a typo) violently compresses the normal options into a microscopic range, destroying their differences.
  - **The "Psychological Zero":** The standard algorithm assigns the absolute worst option a literal `0.0`, entirely destroying its weighted value in the final aggregation.

#### 3. The Modified Min-Max Solution
To synthesize a perfect generic normalizer, I stripped down the standard logic and built an **Upgraded Percentile-Bounded Robust Scaling Algorithm**. This modified implementation strictly overcomes the problems of standard Min-Max:
- **Zero-Collision Protection:** It actively scans the data range and intercepts the fatal division-by-zero error, safely awarding a standardized uniform value of `1.0` to identical items.
- **Outlier Resistance:** Instead of anchoring to absolute limits, it dynamically anchors to the 5th and 95th Percentiles. Any extreme numerical outlier is programmatically capped, preserving the high-resolution differences between the normal clustered items.
- **Zero Floor Bound:** It imposes a hard `0.1` floor, ensuring the mathematically worst item still receives partial psychological credit so it is not unfairly deleted from the final WSM calculation.

By filtering raw values through this heavily guarded modified matrix, the resulting standardized scores are safely aggregated in the WSM engine, guaranteeing the final ranking is mathematically resilient.

## 4) Refactoring decisions
As the project grew in complexity, I made several critical refactoring choices to improve maintainability, performance, and user experience:

- **Frontend-Backend Split (Next.js & Django):** Originally, this could have been a monolithic Next.js application. However, to securely handle API keys (Gemini/OpenAI) and to decouple the heavy mathematical processing (Decision Engine) from the UI, I refactored the architecture into a distinct Next.js frontend and a Django backend.
- **Stateless Architecture over SQLite:** The initial requirements considered an SQLite database. I refactored the design to be entirely stateless (in-memory flow) for now. Since the current scope requires calculating and presenting results dynamically without persistence, dropping SQLite reduced system overhead and simplified the data flow.
- **Dual AI Fallback System:** To ensure high reliability during the AI context and criteria classification phase, I initially refactored the AI integration into a robust fallback mechanism from Gemini to OpenAI. However, I later reverted and removed the OpenAI fallback system because the API is not free to use.
- **State Management Layer:** As the user input phase grew to handle dynamic options, criteria, and weights, managing state via simple React hooks became unwieldy. I refactored the frontend to use a centralized State Management Layer to cleanly validate and package these variables before sending them to the backend orchestrated Decision Engine.

## 5) Mistakes and corrections
Building the underlying logic wasn't instantly perfect; I definitely hit some mathematical and UI walls along the way.

- **Division by Zero:** When first building the standard Min-Max normalization, I didn't account for the scenario where a user might enter identical values for every option in a single criteria column. This immediately triggered a catastrophic division-by-zero error, crashing the engine. I had to correct this by explicitly scanning the dynamic range and hard-assigning a uniform `1.0` if `max == min`.
- **Outlier Compression:** In early testing with standard Min-Max, an extreme input value (e.g., someone typing `9999` by accident) would violently compress all the normal inputs into a tiny percentage range, destroying their differences. I corrected this by engineering a custom percentile-bound approach instead of anchoring to absolute limits.
- **Considering Linear Scale:** Initially, I tried mapping data to a generic 0-to-100 Linear Scale. It was mathematically easy but a major mistake. I realized the engine couldn't inherently know what a "good" number was for arbitrary data like "Square M²" vs "Battery Life Volts". I had to completely restructure the logic to use dynamic group evaluation (Min-Max) so it didn't require hardcoded domain knowledge.
- **UI Bug: Weight Allocation Exceeded:** On the frontend, writing the logic to let users assign weights (up to 100% or 1.0) felt simple until I tested edge cases. Because of JavaScript's quirky floating-point precision, users would perfectly input `1.0` but the UI would trigger a "Weight Exceeded" error (since internally it evaluated to `1.0000000000000002`). I corrected this by rewriting the validation logic to safely round and handle exact matches.

## 6) What changed during development and why
The core concept evolved significantly from the initial brief to the final execution.

1.  **Removing Database Persistence (SQLite):** Originally, the system was scoped to use an SQLite database to store user decision sessions. During development, I realized that for an MVP "Decision Companion," the primary value is in the immediate, interactive calculation, not historical storage. Dropping the database entirely and making the engine stateless reduced backend latency and simplified the architecture.
2.  **AI's Role (From Decider to Assistant):** My initial inclination was to use an LLM (Gemini) as the actual *brains* of the decision engine—feeding it the options and asking it which was best. I quickly changed this when I realized LLMs cannot execute reliable math on weighted matrices. I shifted the AI's role strictly to the "Context Service" (helping users format their criteria as Cost/Benefit) and left the absolute execution to a deterministic mathematical engine.
3.  **UI/UX Scope Creep:** The design phase started with standard tables, but standard tables do not translate well to mobile screens for dense multi-criteria comparison. I changed the design approach drastically midway through to build a responsive, grid-based "Spatial UI" to ensure the heavy data output remained digestible across devices.
4.  **Selecting the Decision Logic (TOPSIS vs WSM):** I originally explored complex algorithms like TOPSIS to calculate the "ideal" distance for comparisons. However, I changed to the **Weighted Sum Model (WSM)**. Why? Because the core requirement was for the app to be *explainable*. WSM provides perfectly linear, easy-to-track math that a user can verify manually, which TOPSIS hides behind complex vector algebra.
5.  **Evolving the Normalization Method:** You can't compare "Square Feet" (house size) directly against "Hours" (laptop battery life). I started with basic Linear Scaling but changed to **Min-Max Normalization** because it evaluates options based on the actual *pool* of items the user enters, requiring zero hardcoded domain knowledge. I further guarded this with percentile caps so bad data (outliers) wouldn't break the comparison.
6.  **Benefit vs. Cost Criteria Handling:** Early on, I treated all user input as "higher score is better." I quickly realized this broke down for attributes like "Price" or "Weight" where *lower* is better. I changed the system to strictly categorize every single criterion as either a "Benefit" (standardized normally) or a "Cost" (inverted during normalization: $1 - \text{score}$), ensuring the final WSM math always accurately rewarded the best functional options.
