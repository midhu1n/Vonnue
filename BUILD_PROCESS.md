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
*(To be updated as the project evolves)*

## 5) Mistakes and corrections
*(To be updated as the project evolves)*

## 6) What changed during development and why
*(To be updated as the project evolves)*
