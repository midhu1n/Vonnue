# Research Log

## 1) All AI prompts used 


### IDE Prompts (Coding Assistant)

#### Phase 0: Foundational Architecture (The 5-Step Blueprint)
**Prompt** 
we want to create a generic decision companion system and iam planning to do this in 5 steps.In each day we create step one by one
> *"so we are dividing this into 5 steps:*
> - *step 1: User defines a goal — first page — must include a search bar. Above the search bar: 'Decision Companion System'. Below the search bar: 'Enter to continue'.*
> - *step 2: Add options (the things being compared, e.g. laptops).*
> - *step 3: Define criteria / weights ('What matters most' page).*
> - *step 4: Rate / score each option against each criterion.*
> - *step 5: View the ranked results with explanation."*


### Phase 0.1: Complete Chronological Prompt Timeline

*The following is a complete chronological record of every major user prompt across all project sessions, extracted from conversation logs spanning **Feb 17 – Mar 1, 2026**.*

---

**[Feb 17, 2026] — Project Initialization**
> *"Initialize the Decision Companion System with a Next.js (React) frontend, Django backend, and SQLite database. Implement the 'Spatial UI' design system guidelines."*

**[Feb 19, 2026] — Backend API & Step 2 (Add Options)**
> *"Implement the backend infrastructure to save user decisions (goals) and their associated options. Connect the frontend Landing Page (Step 1) to this API, and create the 'Add Options' Page (Step 2) with a dynamic UI."*

**[Feb 19, 2026] — Fix Options Feature**
> *"Fix and complete the Decision Options feature. Currently, the backend has the necessary API endpoints, but the frontend integration is missing a proper API URL proxy/rewrite."*

**[Feb 22, 2026] — Criteria Selection (Step 3)**
> *"Implement the third step of the Decision Companion System where the user defines criteria for their decision. Each criterion requires a Name, a Weight (0.0 to 1.0), and a Type (Benefit or Cost). Weights must sum to exactly 1.0."*

**[Feb 22, 2026] — Style the Criteria Page**
> *"The Criteria page (Page 3) looks like a plain HTML file without CSS. Apply the dark glassmorphic Spatial UI style that matches the landing page — including animated backdrops, blur effects, and a shiny save button."*

**[Feb 22, 2026] — Refining Weight Validation (Step 3 refinement)**
> *"Refine the weight validation logic in the criteria page. Ensure the warning message accurately reflects the state: 'No more weight to allocate' when the total weight is exactly 1.0, and 'Weight allocation exceeded' when it goes over 1.0."*

**[Feb 23–24, 2026] — Further Weight Validation Refinements**
> *"Refine the weight validation further — also implement this logic in the addNewEmptyRow function."*

**[Feb 26, 2026] — WSM Results Page (Step 5)**
> *"Implement the Weighted Sum Model (WSM) with Min-Max Normalization to rank options based on their criteria scores. Build the Results page showing a ranked table and explanation."*

**[Feb 26, 2026] — Style the Results Page**
> *"Apply a specific dark gradient background and glassmorphic styling elements from a provided component to the Results page."*

**[Feb 26, 2026] — AI Criteria Classifier (TypeFocus)**
> *"In the 'What Matters Most' section, include a tip — like the one on the rate-your-options page. Assign more weight to the attribute you prefer more. Select TypeFocus suitable for that criteria. Total weight must sum to 1.0. Modify these texts into well-read and stylish, explainable tips."*

**[Mar 1, 2026] — Export to PDF (Initial)**
> *"When we click export, I only want the table details and explanation. Also the laptop final ranking is ok. Exclude all others like 'back to scoring', 'new decision', 'create next app'."*

**[Mar 1, 2026] — Export to PDF (Fix Overflow)**
> *"Now the table is not full — the 'total weighted score' column ends are not visible because the page side ends. Fix it. The table border on the right side is overlapped with the page, also for the explanation generator."*

**[Feb 27, 2026] — Dual AI Fallback**
> *"Integrate the OpenAI API as a fallback for the Gemini API. Configure both API keys in the backend, modify the AI utility functions to attempt Gemini first and then switch to OpenAI if a rate limit error (429) occurs."*

**[Feb 28, 2026] — Repositioning Background Globe**
> *"Reposition the animated globe background to the bottom-left corner of the page. The globe should be smaller and must not overlap with any text elements, specifically the search bar."*

**[Mar 1, 2026] — Movable Sidebar**
> *"Create a movable sidebar that only appears when the user points the cursor to the left side. Also indicate an arrow to alert the user there is a sidebar. Implement this sidebar without affecting the alignment of the page."*

**[Mar 1, 2026] — Analysis Page (4-Section Dashboard)**
> *"In the sidebar options: first include 'Results' pointing to the current page, next include 'Analysis'. When the user clicks Analysis, show all the details entered by the user split into four sections: (1) a detailed table of options, attributes, assigned weights, and normalized weights; (2) a bar graph of attribute weights; (3) a pie chart; (4) a brief explanation of why option A is recommended."*

**[Mar 1, 2026] — Fix Laptop Names in Table**
> *"Include the names of laptops in each row, then display their properties."*

**[Mar 1, 2026] — Modify Pie Chart**
> *"The pie chart and bar chart show the same thing. Modify the pie chart to show something else."*

**[Mar 1, 2026] — UI Text Tweaks**
> *"In the sidebar, remove the '+' symbol from 'New Decision'. Also remove the 'Hover left edge to open' indication."*
> *"'Automated Conclusion' — change it to 'Conclusion'."*

---


**Other Prompts:**
- refine the weight validation logic in the criteria page. Ensuring the warning message accurately reflects the state: 'No more weight to allocate' when the total weight is exactly 1.0, and 'Weight allocation exceeded' when it goes over 1.0. Implementing this logic in the addNewEmptyRow function."*


### Phase 2: Building Resilient Architectures (AI Integrations)
**Prompts:**
- integrate the OpenAI API as a fallback for the Gemini API. This involves configuring both API keys in the backend, modifying the AI utility functions to attempt Gemini first and then switch to OpenAI if a rate limit error occurs, and ensuring the application seamlessly handles this transition without user interruption."*

### Phase 3: UI Theming & Visual Polish
**Prompts:**
- apply a specific dark gradient background and associated styling elements to the results page."*
-  reposition the animated globe background to the bottom-left corner of the page. The globe should be smaller and must not overlap with any text elements, specifically the search bar."*
- *"in what matters most section include a tip just like rate your options page assign more weight for the attribute you more prefer select type focus suitable for that criteria total weight must sums to 1.0 modify these texts into well read and stylish explianable tips"*

### Phase 4: Export Deliverables 
**Prompts:**
- when we click export the image is look like this i only want the table details and explaination also laptop final ranking is ok exclude all others like back to scoring,new decision ,create next app"*


### Phase 5: Dashboard Expansion (Sidebar & Analysis Views)
**Prompts:**
- *"now create a movable side bar only appear when user points cursor to the left side also indicate an arrow to alert the user... implement this sidebar without affecting the alignments of the page"*
- *"in the sidebar options first include Results thats points to current Page Next one in Analysis when the user clicks analysis it must show all the details entered by the user that page can be split in to four... table... bar graph... pie chart... brief explanation why option A is recommend over others"*
- *"include the names of laptops in each row then display their their properties"*
- *"the pie chart and bar shows same thing so modify the pie chart to show something else what do you have in mind"*
- *"Automated conclusion change it into Conclusion"*

### Phase 6: System Documentation
**Prompts:**
- *"Refine the BUILD_PROCESS.md file. Replace the comparative table of MCDA methodologies with a list format. Add a detailed explanation of the normalization strategy, comparing Linear Scale vs. Min-Max, and including the guarded Min-Max logic with equations."*



#### Export to PDF Refinements (`@media print`)
- *"when we click export the image is look like this i only want the table details and explaination also laptop final ranking is ok exclude all others like back to scoring,new decision ,create next app"*
- *"remove this section from exported page whenever user clicks export"*

---

### Gemini Prompts

*The following prompts were used in Google Gemini for research, logic design, and algorithmic decision-making:*

- *"how about this logic"*
- *"is there any issue with this logic"*
- *"should we apply normalization or any other solutions"*
- *"so what will be the correct scoring algorithm — consider the user can ask any real world scenario (e.g. Choosing a laptop under a budget, Selecting the best candidate for a job role, Deciding where to travel within constraints, Picking an investment strategy, Choosing a tech stack for a startup) — so what will it be?"*
- *"my project is a decision companion system — so it is for a generic case not bounded to a specific domain. The data flow looks like: system asks 'What decision are you trying to make today?' → user inputs options → user inputs criteria and weights → user inputs raw values → system uses WSM model with cost and benefit criterion and picks the best option and generates a summary why it is picked as best"*
- *"instead of linear scale use min max normalization to solve the problem"*
- *"so which method should I choose in WSM"*
- *"Forget plain min-max. The version you should move forward with is essentially an upgraded min-max that has two protections built in: Protection 1 — Outlier resistance (Robust Scaling): use the 5th and 95th percentile as boundaries. Protection 2 — Zero floor (Bounded scaling): scale to [0.1, 1] instead of [0, 1]. const normalized = 0.1 + 0.9 × (capped − p5) / (p95 − p5); how about this"*
- *"i need a test case to test my system — Selecting the best candidate for a job role — give criteria and their assigned weights"*
- *"by meaning MCDA we have to consider only one real world scenario am i right? for ex choosing a laptop under budget or Selecting the best candidate for a job role — or we have to choose both? this is the case where I am stuck"*
- *"which is better — TOPSIS or weighted sum model"*
- *"so in the TOPSIS model we won't need to apply normalization for any real world scenario user prompt"*
- *"weighted sum model — explain it with example for choosing a laptop under budget, give laptop options, add different criteria, add different weights, explain why it needs normalization"*
- *"so how do I normalize the data that will be entering in raw numbers before calculating the score — so the benefit criteria and cost criteria logic works for any real world scenario, not only just choosing a laptop under a budget"*
- *"in the next section of the website the user enters the values — but I have a doubt: ratings like performance can be out of 10, price can be very large values (e.g. 85000/-), battery can be like 12 hrs — not just for the laptop case, consider this for all generic cases — how do I prompt to achieve this so the user understands easily"*

---

### ChatGPT Prompts

*The following prompts were used in ChatGPT for brainstorming and problem clarification:*

- *"so what are the different real case scenarios can we consider — list them"*
- *"my decision comparison system normalized matrix looks like this — why is that"*
- *"Min–Max (0–1 scaling): avoid Division by Zero — methods like Linear Max or Max-Min can fail if the maximum value or range is zero — does min-max get affected by this"*
- *"in the front page instead of showing 'Decision Companion System' it would be better if we give a name for our project — what do you have in mind"*

---

### Claude Prompts

*The following prompts were used in Anthropic Claude for structural and algorithmic exploration:*

- *"i need to build a multi-criteria decision system — what will be the scoring/ranking algorithm"*
- *"how about cases like benefit criteria and cost criteria"*

---




## 2) All search queries (including Google searches)

#### Research & Theory
- *What is a Decision Comparison System?*
- *Common Techniques what are they for DCS*
- *List the Key Use Cases of DCS*
- *Key Components of a Decision Support System*
- *which method is best for DCS*
- *TOPSIS vs WSM*
- *advantages and disadvantages of WSM*
- *different types of normalization in WSM*
- *Edge cases to be considered in WSM*
- *benefit and cost criteria categorization*
- *linear scale vs min max normalization*
- *what is multi criteria decision analysis*
- *how does weighted sum model work*
- *what is normalization in data*
- *how to handle division by zero in normalization*
- *percentile based normalization method*
- *explainable AI in decision support systems*
- *how does TOPSIS algorithm work step by step*
- *what is the difference between benefit and cost criteria in MCDA*

#### Implementation & Technical
- *how to build a decision support system with react and django*
- *how to store decision data in django rest framework*
- *how to use recharts in react for data visualization*
- *what is glassmorphism UI design*
- *how to implement dark mode in next js tailwind*
- *how to export react page to pdf using css media print*
- *how to create a sliding sidebar in react*
- *openai api fallback when gemini rate limit exceeded*
- *what is the gemini api rate limit 429 error*
- *how to integrate gemini api in django backend*


## 3) References that influenced your approach

1. Wikipedia contributors, "Weighted sum model," *Wikipedia*, 2024. [Online]. Available: [https://en.wikipedia.org/wiki/Weighted_sum_model](https://en.wikipedia.org/wiki/Weighted_sum_model)

2. GeeksforGeeks, "Weighted Sum Method (Multi-Criteria Decision Making)," 2023. [Online]. Available: [https://www.geeksforgeeks.org/dsa/weighted-sum-method-multi-criteria-decision-making/](https://www.geeksforgeeks.org/dsa/weighted-sum-method-multi-criteria-decision-making/)

3. Tempo Software, "Weighted Scoring Model: A Guide to Prioritization," 2023. [Online]. Available: [https://www.tempo.io/blog/weighted-scoring-model](https://www.tempo.io/blog/weighted-scoring-model)

4. G. Bang, D. Kim, and M. Min, "Transforming User-Defined Criteria into Explainable Indicators with an Integrated LLM–AHP System," *arXiv*, 2025. Available: [https://arxiv.org/abs/2601.05267](https://arxiv.org/abs/2601.05267)

5. I. N. Ezeji, M. O. Adigun, and O. Oki, "Strategic Selection of Application Area for Optimizing Computational Complexity in Explainable Decision Support System Using Multi-Criteria Decision Analysis (MCDA)," *Journal of Systemics, Cybernetics and Informatics*, vol. 23, no. 2, pp. 36–47, 2025.

6. Munich Business School, "Weighted sum model," *Business Studies Dictionary*. [Online]. Available: [https://www.munich-business-school.de/en/l/business-studies-dictionary/weighted-sum-model](https://www.munich-business-school.de/en/l/business-studies-dictionary/weighted-sum-model)

## 4) What you accepted, rejected, or modified from AI outputs


### What I Accepted
**1. UI Boilerplate & Syntax Formatting:** I largely accepted AI-generated Tailwind CSS utility class strings for rapid prototyping. For example, the complex glassmorphic glow effects, sidebar transition animations, and responsive grid layouts were integrated directly as they accelerated development of a premium aesthetic.
**2. Recharts Integration Patterns:** I accepted the AI's structural boilerplate for mapping API JSON responses into the rigid coordinate data required by the `recharts` library for the Analysis page.
**3. The Dual Fallback Architecture:** I accepted the architectural design proposed by the AI to utilize OpenAI as a seamless fallback to the Gemini SDK when hitting 429 Rate Limit errors in the AI Context Service.
**4. AI Criteria Classifier (TypeFocus):** I accepted the AI's logic for automatically suggesting whether a criterion is a "Cost" or "Benefit" via the AI Context Service. However, to maintain human-in-the-loop control, I implemented it strictly as a suggestion, ensuring the user can always manually override the AI's "TypeFocus" classification before finalizing the decision model.

### What I Rejected
**1. AI as a Black Box Decision Maker:** I fundamentally rejected any AI output that suggested the LLM itself should choose the "best" option for the user. To maintain the project's integrity as an *explainable* MCDA tool, I restricted the AI entirely to standardizing criteria (defining "Cost" vs. "Benefit"). The core mathematical calculation (WSM) remained strictly deterministic.
**2. Standard Min-Max Normalization Math:** I rejected standard, out-of-the-box mathematical algorithms generated by the AI for normalization. Standard Min-Max algorithms would inevitably crash the application during "Division by Zero" events or skew heavily due to user-input outliers. 
**3. Redundant Charting Metrics:** During the Analysis page generation, the AI initially suggested a Pie Chart that duplicated the exact same attribute weight data as the Bar Chart. I rejected this redundancy and explicitly prompted the AI to calculate a new metric (Total Final Score Proportion per Option) for the pie chart instead.

### What I Modified
**1. The Normalization Algorithm (Bounded Scaling):** I heavily modified the AI's baseline normalization math. I intercepted its standard equations and injected a custom 95th Percentile Bounded Scaling logic with explicit zero-variance guardrails to structurally prevent application crashes and outlier compression.
**2. PDF Export Styling (`@media print`):** The AI originally generated a "working" print function, but it blindly exported the entire visible DOM, including navigation sidebars and glowing backgrounds. I iteratively modified the CSS architecture using `print:hidden` and `print:break-words` targeting specific hierarchies to transform the chaotic web UI into a clean, minimalist, white-background business report.
**3. UI Text Constraints:** I continuously modified AI-generated interface copy to ensure it remained extremely concise. For instance, modifying the AI's verbose "Automated Conclusion" header to simply say "Conclusion", and requesting "Hover left edge to open" warnings be completely deleted in favor of minimalist icon indicators.
