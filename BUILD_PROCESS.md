# Build Process

## 1) How you started
I initiated this project using a dual-track development approach, tackling the user experience and the core logic simultaneously.

- Track 1 (The Algorithm): I began by researching Multi-Criteria Decision Analysis (MCDA) systems. I needed an algorithm that was mathematically sound but also easily explainable to the end-user. I mapped out the logic for a Weighted Sum Model (WSM).

- Track 2 (The Interface): In parallel, I designed the home page and established a strict monochromatic "Spatial UI" (DESIGN_SYSTEM.md). Because decision-making matrices are data-heavy, I knew a clean, low-cognitive-load UI was essential before writing any complex React state logic.

Tech Stack Selection: I went with **Next.js** and **Tailwind CSS** for the frontend because they let me build the UI fast. For the backend, I used **Django Framework**
 

## 2) How your thinking evolved
Initially, when I read "Decision Companion," my instinct was to build a chatbot wrapper around the OpenAI/Gemini API and just pass the user's options to an LLM to pick a winner.

However, as I analyzed the constraints specifically "Your logic should be explainable (not a black box)"my thinking completely pivoted. I realized an LLM is the ultimate black box. It cannot do reliable weighted arithmetic, and it hallucinates. I evolved my architecture to use a deterministic mathematical engine for the actual decision-making, limiting any AI usage strictly to natural language formatting or UI assistance, rather than the calculation itself.
My focus was just on capturing the decision query and standard options. However, as the need for objective, mathematically-backed evaluations became clear. 
one of the main challenge was to Solving the Normalization Issue :
You cannot compare "Price" (where lower is better) directly with "Performance" (where higher is better) or "Battery Life" (measured in hours vs. dollars).So a solution is to be considered.

## 3) Alternative approaches considered
*(To be updated as the project evolves)*

## 4) Refactoring decisions
*(To be updated as the project evolves)*

## 5) Mistakes and corrections
*(To be updated as the project evolves)*

## 6) What changed during development and why
*(To be updated as the project evolves)*
