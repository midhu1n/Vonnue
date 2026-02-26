# Decision Companion System

## 1) Understanding of the Problem
Build a Decision Companion System, a dynamic Multi-Criteria Decision Analysis (MCDA) application. The app allows users to create decision models, define custom criteria with varying weights, input multiple options, and systematically evaluate them to generate mathematically backed, ranked recommendations with clear, human-readable explanations.
The core challenge is to create a system that can take any real-world scenario (buying a laptop, hiring a candidate, etc.) and evaluate it objectively without relying on an AI "black box." The prompt emphasizes transparency and explainability. Therefore, my understanding is that the system must mathematically calculate the best option based on user-defined weights and variables, and then clearly explain how that math resulted in the final ranking. The AI's role (if any) should be limited to enhancing the user experience, not making the actual decision.

## 2) Assumptions Made
- Cost vs. Benefit: I assumed criteria fall into two strict categories: "Benefit" (where a higher number is better, like Battery Life) and "Cost" (where a lower number is better, like Price).
- A decoupled architecture (frontend and backend separated) is preferable to allow independent scaling, easier technology upgrades, and clearer separation of concerns.
- Rational Inputs: I assumed the user can quantify their criteria (e.g., providing a score out of 10 for "Brand Quality" or an actual dollar amount for "Price").
- Single User Context: I assumed the tool is for personal/individual use, so I did not implement multi-user collaboration

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

## 4) Design decisions and trade-offs
*(To be updated as the project evolves)*

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
