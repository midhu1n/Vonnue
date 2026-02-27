# Decision Companion System

## 1) Understanding of the Problem
Build a Decision Companion System, a dynamic Multi-Criteria Decision Analysis (MCDA) application. The app allows users to create decision models, define custom criteria with varying weights, input multiple options, and systematically evaluate them to generate mathematically backed, ranked recommendations with clear, human-readable explanations.
The core challenge is to create a system that can take any real-world scenario (buying a laptop, hiring a candidate, etc.) and evaluate it objectively without relying on an AI "black box." The prompt emphasizes transparency and explainability. Therefore, my understanding is that the system must mathematically calculate the best option based on user-defined weights and variables, and then clearly explain how that math resulted in the final ranking. The AI's role (if any) should be limited to enhancing the user experience, not making the actual decision.

## 2) Assumptions Made
- **Cost vs. Benefit:** I assumed criteria fall into two strict categories: "Benefit" (where a higher number is better, like Battery Life) and "Cost" (where a lower number is better, like Price). To streamline the user experience, I integrated AI assistance to automatically classify attributes (e.g., guessing "Cost" when a user types "Price"), but always provided the user with a UI toggle to manually override the AI's decision if needed.
- **Normalization Strategies:** I built the engine assuming the user expects a *generic* decision engine capable of comparing any unit of measurement, rather than a domain-specific app. Therefore, I assumed a **Min-Max Normalization** strategy was required over a **Linear Scale**, as Linear Scaling relies on hardcoded, domain-specific minimums and maximums (which is impossible for a generic tool to know in advance).
- A decoupled architecture (frontend and backend separated) is preferable to allow independent scaling, easier technology upgrades, and clearer separation of concerns.
- Rational Inputs: I assumed the user can quantify their criteria (e.g., providing a score out of 10 for "Brand Quality" or an actual dollar amount for "Price").
- Single User Context: I assumed the tool is for personal/individual use, so I did not implement multi-user collaboration.

## 3) Why you structured the solution the way you did

As an engineering student, I am trying to prioritize **Separation of Concerns** and **Deterministic Logic**, especially for a system designed to handle complex, multi-variable problems. I structured this solution around a few core architectural and algorithmic decisions:

### Decoupled Architecture (Logic vs. Presentation)
I intentionally separated the frontend UI components from the mathematical scoring engine. By decoupling these layers, the UI acts purely as a **data-collection and visualization tool**, while the scoring engine remains a **standalone utility**. This makes the logic easily testable and ensures the engine could theoretically be extracted into an independent API or CLI tool in the future without breaking the application.

### Choosing a Deterministic Engine over Generative AI
To satisfy the constraint that the logic must be *"explainable"* and *"not a black box,"* I did not rely on a chatbot API to guess the best answer. I wrote a deterministic, mathematical algorithm (the Weighted Sum Model) to calculate the exact, undeniable winner based on the user's numbers.This ensures that the final ranking is:
- 100% mathematically backed
- Fully traceable
- Completely immune to AI hallucinations

### Solving the Problem of Data Asymmetry(Normalization)
A major challenge in MCDA systems is **data asymmetry**  ,for example, comparing a $1,500 laptop price against an 18-hour battery life. If you multiply raw values by weights, larger numbers will unfairly dominate the final score. To solve this, I designed the system to operate in two distinct phases. First, the user establishes the baseline rules by defining criteria and assigning weights. Second, the user inputs the raw data for their options. Before the engine applies the weights from step one to the data in step two, it processes all raw inputs through a **Min-Max Normalization** pipeline. This converts every varied value into a standard `0.0` to `1.0` scale, ensuring fair and accurate calculations regardless of the original unit of measurement.

### The 'Cost' vs. 'Benefit' Polarity
Normalization alone isn't enough; the system needs to understand **context**. I structured the data model to classify every criterion as either:
- **"Benefit"** — where a higher value is better (e.g., Battery Life)
- **"Cost"** — where a lower value is better (e.g., Price)

The scoring engine dynamically inverses the normalization math for 'Cost' attributes, ensuring that a lower price correctly translates into a **higher normalized score**.

### Modified Min-Max with Guardrails / Bounded Weights
While establishing the data normalization pipeline, I identified critical structural flaws in the standard Min-Max equation. Out-of-the-box Min-Max is highly sensitive to extreme inputs ("Outlier Compression") and mathematically crashes if the dataset has no variance (Division by Zero).

To build a truly resilient calculation engine, I discarded the standard formula in favor of an **Upgraded Percentile-Bounded Robust Scaling algorithm**. This structural choice solves two major system-breaking problems:
1. **Outlier Compression Prevention:** Instead of anchoring the normalization scale to the absolute boundaries of the data, the engine anchors to the **5th and 95th percentiles**. If a user enters one massive extreme outlier, the engine mathematically "caps" it at the 95th percentile. This structurally protects the algorithm's resolution, ensuring that the meaningful differences between the normal, cluster-grouped options are preserved and scorable. 
2. **Division by Zero Protection:** If a specific criterion has identical values across all options (yielding a `Max - Min` range of `0`), standard math causes a fatal application crash. I structurally intercepted this at the algorithm level: the engine detects the zero-range collision before calculation and gracefully bypasses the division, neutralizing the crash and fairly awarding a `1.0` score to all identically matched items.

## 4) Design decisions and trade-offs

The architecture of the Decision Companion System was designed as a linear pipeline to ensure data integrity and true separation of concerns. As illustrated in earlier planning, the core logic is broken down into distinct modules:

### A. Data Ingestion & Validation Module
Before any math occurs, the system intercepts user input (Criteria, Options, Scores).
*   **Design Decision:** We implemented a strict validation flow *before* data reaches the engine. If a user enters incomplete matrices or weights that exceed `1.0`, the system blocks the request.
*   **Trade-off:** This introduces more frontend error-handling complexity and slightly higher friction for the user, but it guarantees that the mathematical engine will never crash due to `NaN` or `null` constraints.

### B. The Standardization Flow (AI Context Service)
*   **Design Decision:** We integrated an external LLM API as an "AI Context Service" to automatically classify user criteria as a "Benefit" or a "Cost". 
*   **Trade-off:** Relying on an external API introduces latency during data entry and creates a dependency on a third-party service. However, it massively streamlines the user experience. To mitigate the risk of AI hallucination, the service acts only as a *recommendation engine*, providing a manual override toggle in the UI so the user always retains ultimate control over the mathematical polarity.

### C. The Decision Engine: Normalization & Aggregation
The core of the system operates in an isolated environment.
*   **Design Decision:** We split the math into two distinct steps: the **Normalization Engine** (which converts varied raw data like "$1,500" or "18 Hours" into standard `0.1` to `1.0` metrics using percentiles) and the **Aggregation Core** (which applies the Weighted Sum Model to calculate the final score).
*   **Trade-off:** Processing the data through two separate algorithms increases computational overhead slightly compared to a single monolithic function. However, this modularity allows us to swap out the Normalization logic (e.g., from Min-Max to Z-Score) in the future without ever having to touch or accidentally break the WSM Aggregation logic.

### D. The Explanation Generator
*   **Design Decision:** Instead of relying on an AI to vaguely describe why an option won, we built a deterministic Explanation Generator. It programmatically analyzes the output of the Aggregation Core, finding the maximum mathematical differentials between the winner and the runner-up.
*   **Trade-off:** The generated explanations are somewhat rigid and formulaic compared to the natural language an LLM could produce. However, this guarantees 100% transparency. The user receives a human-readable explanation that strictly, undeniably reflects the exact math that occurred in the Aggregation step.

## 5) Edge cases considered

To build a robust and trustworthy system, I anticipated several scenarios where user interaction could break the application state or skew the mathematical engine. I implemented defensive programming strategies to handle these edge cases gracefully:

### Incomplete Data Entry (Missing Data)
If a user attempts to save a criteria or option row while leaving essential fields blank, the system intercepts the action and displays a validation warning. This prevents `null` or `NaN` values from passing into the engine and crashing the final calculation.

### Unsaved State Management
Users often move quickly when inputting complex matrix data. If a user attempts to add a new data row while the previous one is still unsaved, the UI actively warns them. This ensures no progress is accidentally overwritten or lost during rapid data entry.

### Mathematical Bounds Checking (Weight Limits)
The evaluation engine relies on accurate weighting to function correctly. If a user attempts to allocate an attribute weight that falls outside the permissible `0.0` to `1.0` scale, the system immediately blocks the input and surfaces an error message, preserving the mathematical integrity of the algorithm.

### Mid-Evaluation State Changes
Real-world decision-making is rarely linear; users often change their minds. I handled the edge case of dynamic matrix manipulation by ensuring the application state doesn't break if a user alters the rules halfway through. Users can interactively adjust weights, add or remove options, and modify specific scores on the fly. The system dynamically accepts these updates and recalculates the outcome without requiring a hard reset or session restart.

### Normalization Strategies

When building a robust decision engine, transforming raw user inputs (which can vary wildly in scale, like "Dollars" vs. "GigaHertz") into a standardized `0.0` to `1.0` score is the most critical and challenging step. 

We had to choose between two primary normalization strategies: **Linear Scale** and **Min-Max Normalization**. Here is why we chose our current method and the distinct edge cases we had to calculate for.

#### 1. Linear Scaling (The Absolute Approach)
Linear scaling sets absolute boundaries (e.g., scoring a laptop out of a theoretical maximum of 100).
*   **Why it's great for specific domains:** If the app *only* compared laptops, we know that a 15-hour battery is incredible (Score: `1.0`) and a 2-hour battery is awful (Score: `0.1`). The engine doesn't need to look at other laptops to know what "good" looks like. It is objectively fair based on real-world knowledge.
*   **Its Drawback:** It requires hardcoded domain expertise. It is utterly useless for a *generic* decision system because the engine has no idea if "10" is a good score for "Miles per Gallon," "Years of Experience," or "Number of Bedrooms."

#### 2. Min-Max Normalization (The Relative Approach)
Because this is a **Generic Decision Companion**, we implemented Min-Max Normalization. The engine dynamically looks at the *actual group of items* the user entered and assigns the best option a `1.0` and the worst a `0.0`. 
*   **Why it's better for generic systems:** It requires zero domain knowledge. Whether comparing rockets or resumes, the engine mathematically understands the best and worst *available* options in the current dataset.

However, standard Min-Max introduces two dangerous mathematical flaws that our custom algorithm actively protects against:

**A. The "Psychological Zero" Problem**
If comparing four highly-rated safety features (Scores: 8, 8, 9, 10), standard Min-Max gives the "8" a score of exactly `0.0`. Psychologically, an 8/10 is not worthless, but the math treats it as entirely useless, unfairly nuking its overall Weighted Sum Model (WSM) score.
*   **Our Solution (Bounded Scaling):** We scale to `[0.1, 1.0]` instead of `[0.0, 1.0]`. The worst option receives exactly `10%` credit. This ensures the option remains mathematically alive in the calculation, acknowledging it still has baseline value.

**B. Outlier Compression**
If a user compares laptops with 256GB, 512GB, and 1,000GB of storage, but mistakenly enters a typo for a 4th laptop as `100,000GB`, standard Min-Max breaks. It stretches the scale to 100,000, compressing the 256GB, 512GB, and 1,000GB laptops into almost identical scores of `0.001` and `0.009`. It erases the meaningful differences between the normal options.
*   **Our Solution (Robust Percentile Capping):** Instead of using the *True Maximum*, our upgraded algorithm calculates the **95th Percentile** of the dataset and uses that as the ceiling. Extreme outliers are mathematically capped at the 95th percentile, preserving the high-resolution differences between the normal data points. 

**C. Division by Zero Risk**
The core formula for Min-Max is `(Value - Min) / (Max - Min)`. If all options are identical (e.g., every laptop costs exactly $1,000), `Max - Min` becomes `0`.
*   **Our Solution:** The system explicitly checks if the range is zero. If it is, the engine gracefully bypasses the complex calculation and awards a uniform `1.0` score to all options for that category, preventing application crashes.

## 6) How to run the project

### Tech Stack
- **Frontend:** Next.js (React 18), Tailwind CSS, Shadcn UI
- **Backend:** Django REST Framework, SQLite

### Prerequisites
- Node.js (v18+ recommended)
- Python (v3.10+ recommended)
- `npm` or `yarn` (for the frontend)

### Setting up the Backend
1. Navigate into the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate (Windows)
   venv\Scripts\activate
   
   # Activate (macOS/Linux)
   source venv/bin/activate
   ```
3. Install dependencies (e.g., `django`, `djangorestframework`, `django-cors-headers`):
   ```bash
   pip install django djangorestframework django-cors-headers
   ```
4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
5. Run the development server:
   ```bash
   python manage.py runserver
   ```
   The backend API will be available at [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

### Setting up the Frontend
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the JavaScript dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The Next.js frontend will be available at [http://localhost:3000](http://localhost:3000).

## 7) What you would improve with more time
*(To be updated as the project evolves)*
