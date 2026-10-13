import asyncio
import random
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.question import Question, QuestionOption, RubricCriterion
from app.models.exam import Exam, ExamQuestion
from app.models.grading_policy import GradingPolicy, GradeCutoff
from app.models.submission import StudentSubmission, StudentAnswer
from app.services.grade_engine import calculate_grades_for_submissions
from app.services.percentile_engine import compute_percentiles_and_ranks

# 8 Semesters with distinct subjects and realistic examination questions
SEMESTER_QUESTIONS = [
    # --- SEMESTER 1 ---
    {
        "semester": 1,
        "course_id": "CS101",
        "subject_code": "CS101",
        "subject_name": "Programming for Problem Solving (Python & C)",
        "unit": 1,
        "topic": "Recursion & Memory Stack",
        "type": "MCQ_SINGLE",
        "prompt": "In a recursive function without a proper base case, which memory structure overflows leading to a program termination crash?",
        "prompt_latex": r"T(n) = T(n-1) + \mathcal{O}(1)",
        "difficulty": "EASY",
        "bloom_level": "UNDERSTAND",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "c,recursion,memory,stack",
        "options": [
            {"text": "Call Stack / Execution Stack", "is_correct": True},
            {"text": "Heap Memory Area", "is_correct": False},
            {"text": "BSS Data Segment", "is_correct": False},
            {"text": "CPU Register Cache", "is_correct": False},
        ]
    },
    {
        "semester": 1,
        "course_id": "MATH101",
        "subject_code": "MATH101",
        "subject_name": "Linear Algebra & Single Variable Calculus",
        "unit": 2,
        "topic": "Gaussian Integrals & Definite Integrals",
        "type": "NUMERICAL",
        "prompt": "Evaluate the definite integral of x^3 from 0 to 4.",
        "prompt_latex": r"\int_{0}^{4} x^3 \, dx",
        "target_numeric": 64.0,
        "min_tolerance": 63.9,
        "max_tolerance": 64.1,
        "difficulty": "EASY",
        "bloom_level": "APPLY",
        "marks": 5.0,
        "negative_marks": 0.0,
        "tags": "calculus,integrals,math",
    },
    {
        "semester": 1,
        "course_id": "PHY101",
        "subject_code": "PHY101",
        "subject_name": "Engineering Physics & Quantum Optics",
        "unit": 3,
        "topic": "Schrodinger Wave Mechanics",
        "type": "SUBJECTIVE",
        "prompt": "State the time-independent Schrödinger wave equation for a particle confined in an infinite 1D potential well of width L. Derive the quantized energy eigenvalues.",
        "prompt_latex": r"-\frac{\hbar^2}{2m} \frac{d^2\psi}{dx^2} + V(x)\psi = E\psi \quad \implies \quad E_n = \frac{n^2 \pi^2 \hbar^2}{2m L^2}",
        "difficulty": "MEDIUM",
        "bloom_level": "ANALYZE",
        "marks": 15.0,
        "negative_marks": 0.0,
        "tags": "physics,quantum,wave-equation",
        "model_answer": "Boundary conditions psi(0)=0 and psi(L)=0 yield sin(n*pi*x/L) and En = n^2*h^2/(8*m*L^2).",
        "rubrics": [
            {"title": "Boundary Conditions Application", "max_marks": 5.0, "description": "Applying psi(0)=0 and psi(L)=0 correctly."},
            {"title": "Wavefunction Normalization", "max_marks": 5.0, "description": "Finding normalization constant sqrt(2/L)."},
            {"title": "Energy Eigenvalues Derivation", "max_marks": 5.0, "description": "Correct derivation of E_n proportional to n^2."},
        ]
    },

    # --- SEMESTER 2 ---
    {
        "semester": 2,
        "course_id": "CS102",
        "subject_code": "CS102",
        "subject_name": "Object-Oriented Programming (Java & C++)",
        "unit": 2,
        "topic": "Polymorphism & Virtual Functions",
        "type": "MCQ_SINGLE",
        "prompt": "How does C++ achieve runtime dynamic dispatch for virtual methods at the compiler and memory level?",
        "prompt_latex": r"\text{vptr} \longrightarrow \text{vtable}[\text{method\_index}]",
        "difficulty": "MEDIUM",
        "bloom_level": "ANALYZE",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "cpp,oop,vtable,polymorphism",
        "options": [
            {"text": "Virtual Method Table (vtable) and vptr pointer", "is_correct": True},
            {"text": "Name mangling during linking", "is_correct": False},
            {"text": "Static code replacement via macros", "is_correct": False},
            {"text": "Heap symbol dictionary lookup", "is_correct": False},
        ]
    },
    {
        "semester": 2,
        "course_id": "ECE101",
        "subject_code": "ECE101",
        "subject_name": "Digital Logic & Electronic Circuit Design",
        "unit": 1,
        "topic": "Karnaugh Maps & Boolean Minimization",
        "type": "MCQ_MULTI",
        "prompt": "Which of the following are valid properties of Karnaugh Maps (K-Maps)?",
        "difficulty": "EASY",
        "bloom_level": "UNDERSTAND",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "digital-logic,kmaps,boolean",
        "options": [
            {"text": "Adjacent cells differ by exactly one bit (Gray Code ordering).", "is_correct": True},
            {"text": "Groups must be formed in powers of 2 (1, 2, 4, 8, 16).", "is_correct": True},
            {"text": "Diagonal groupings are allowed for 3-variable maps.", "is_correct": False},
            {"text": "Can be wrapped around horizontally and vertically.", "is_correct": True},
        ]
    },

    # --- SEMESTER 3 ---
    {
        "semester": 3,
        "course_id": "CS201",
        "subject_code": "CS201",
        "subject_name": "Data Structures & Algorithms",
        "unit": 3,
        "topic": "Balanced Search Trees (AVL)",
        "type": "MCQ_SINGLE",
        "prompt": "What is the maximum allowed balance factor for any node in an AVL tree before a tree rotation is triggered?",
        "prompt_latex": r"\text{BF}(node) = \text{height}(\text{left}) - \text{height}(\text{right}) \in \{-1, 0, 1\}",
        "difficulty": "EASY",
        "bloom_level": "REMEMBER",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "dsa,avl,trees,rotation",
        "options": [
            {"text": "{-1, 0, 1}", "is_correct": True},
            {"text": "{-2, 0, 2}", "is_correct": False},
            {"text": "{0, 1}", "is_correct": False},
            {"text": "Any non-negative integer", "is_correct": False},
        ]
    },
    {
        "semester": 3,
        "course_id": "CS203",
        "subject_code": "CS203",
        "subject_name": "Computer Organization & Architecture",
        "unit": 4,
        "topic": "Pipelining & Branch Hazards",
        "type": "NUMERICAL",
        "prompt": "A 5-stage non-pipelined processor executes an instruction in 10 ns. Ideal pipelined processor has a 2 ns clock cycle. What is the theoretical maximum speedup for a program with infinite instructions?",
        "prompt_latex": r"S_{\max} = \frac{T_{\text{non-pipe}}}{T_{\text{pipe}}} = \frac{k \cdot \tau}{\tau} = k",
        "target_numeric": 5.0,
        "min_tolerance": 4.9,
        "max_tolerance": 5.1,
        "difficulty": "EASY",
        "bloom_level": "APPLY",
        "marks": 5.0,
        "negative_marks": 0.0,
        "tags": "coa,pipelining,speedup",
    },

    # --- SEMESTER 4 ---
    {
        "semester": 4,
        "course_id": "CS204",
        "subject_code": "CS204",
        "subject_name": "Operating Systems & Kernel Programming",
        "unit": 2,
        "topic": "Deadlock Avoidance & Banker's Algorithm",
        "type": "SUBJECTIVE",
        "prompt": "Explain the four necessary conditions for deadlock (Coffman conditions). Detail how Banker's Algorithm detects safe states using Available, Allocation, and Need matrices.",
        "prompt_latex": r"\text{Need}[i][j] = \text{Max}[i][j] - \text{Allocation}[i][j]",
        "difficulty": "MEDIUM",
        "bloom_level": "ANALYZE",
        "marks": 15.0,
        "negative_marks": 0.0,
        "tags": "os,deadlock,bankers-algorithm",
        "model_answer": "Mutual exclusion, Hold and wait, No preemption, Circular wait. Safe state check algorithm loop.",
        "rubrics": [
            {"title": "Coffman Conditions Enumeration", "max_marks": 5.0, "description": "Clear explanation of all 4 conditions."},
            {"title": "Need Matrix Definition", "max_marks": 4.0, "description": "Need = Max - Allocation relation."},
            {"title": "Safety Algorithm Sequence", "max_marks": 6.0, "description": "Work and Finish vectors with safe sequence derivation."},
        ]
    },
    {
        "semester": 4,
        "course_id": "CS205",
        "subject_code": "CS205",
        "subject_name": "Database Management Systems (DBMS)",
        "unit": 3,
        "topic": "Relational Normalization & BCNF",
        "type": "MCQ_MULTI",
        "prompt": "Which statements are strictly TRUE regarding Boyce-Codd Normal Form (BCNF)?",
        "prompt_latex": r"\forall X \to Y \in F^+, \; X \text{ must be a superkey}",
        "difficulty": "HARD",
        "bloom_level": "ANALYZE",
        "marks": 10.0,
        "negative_marks": 2.0,
        "tags": "dbms,bcnf,normalization",
        "options": [
            {"text": "Every relation in BCNF is also in 3NF.", "is_correct": True},
            {"text": "BCNF decomposition always guarantees lossless join.", "is_correct": True},
            {"text": "BCNF decomposition always preserves all functional dependencies.", "is_correct": False},
            {"text": "A relation with only two attributes is always in BCNF.", "is_correct": True},
        ]
    },

    # --- SEMESTER 5 ---
    {
        "semester": 5,
        "course_id": "CS301",
        "subject_code": "CS301",
        "subject_name": "Design & Analysis of Algorithms",
        "unit": 2,
        "topic": "Dynamic Programming (0/1 Knapsack)",
        "type": "SUBJECTIVE",
        "prompt": "Formulate the optimal substructure and recurrence relation for the 0/1 Knapsack problem. Explain why the greedy approach fails for 0/1 Knapsack while working for Fractional Knapsack.",
        "prompt_latex": r"dp[i][w] = \max(dp[i-1][w], \, dp[i-1][w - wt[i-1]] + val[i-1])",
        "difficulty": "HARD",
        "bloom_level": "EVALUATE",
        "marks": 15.0,
        "negative_marks": 0.0,
        "tags": "algorithms,knapsack,dp",
        "model_answer": "State recurrence relation. Show counterexample where greedy ratio choice leaves unused capacity yielding suboptimal total.",
        "rubrics": [
            {"title": "Recurrence State Definition", "max_marks": 6.0, "description": "Base cases and transition equation."},
            {"title": "Counterexample for Greedy Failure", "max_marks": 5.0, "description": "Concrete numerical counterexample."},
            {"title": "Time and Space Complexity", "max_marks": 4.0, "description": "O(nW) pseudo-polynomial time proof."},
        ]
    },
    {
        "semester": 5,
        "course_id": "CS302",
        "subject_code": "CS302",
        "subject_name": "Computer Networks & Internet Protocols",
        "unit": 4,
        "topic": "TCP Congestion Control",
        "type": "MCQ_SINGLE",
        "prompt": "In TCP Reno congestion control, what happens to the congestion window (cwnd) when a triple duplicate ACK is detected (Fast Retransmit)?",
        "prompt_latex": r"\text{ssthresh} = \frac{\text{cwnd}}{2}, \quad \text{cwnd} = \text{ssthresh} + 3",
        "difficulty": "MEDIUM",
        "bloom_level": "APPLY",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "networking,tcp,congestion-control",
        "options": [
            {"text": "cwnd is halved (enters Fast Recovery, not reset to 1 MSS)", "is_correct": True},
            {"text": "cwnd is reset to 1 MSS immediately", "is_correct": False},
            {"text": "cwnd remains unchanged but RTT timer is doubled", "is_correct": False},
            {"text": "Connection is reset with an RST packet", "is_correct": False},
        ]
    },

    # --- SEMESTER 6 ---
    {
        "semester": 6,
        "course_id": "CS306",
        "subject_code": "CS306",
        "subject_name": "Artificial Intelligence & Knowledge Systems",
        "unit": 1,
        "topic": "A* Heuristic Search & Admissibility",
        "type": "MCQ_SINGLE",
        "prompt": "For the A* search algorithm on a tree graph to guarantee finding the optimal shortest path, what condition must heuristic function h(n) satisfy?",
        "prompt_latex": r"f(n) = g(n) + h(n), \quad \forall n: \; 0 \le h(n) \le h^*(n)",
        "difficulty": "MEDIUM",
        "bloom_level": "APPLY",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "ai,a-star,heuristic,admissibility",
        "options": [
            {"text": "Admissible (never overestimates the true cost to goal)", "is_correct": True},
            {"text": "Non-decreasing and monotonic strictly greater than h*(n)", "is_correct": False},
            {"text": "Negative whenever g(n) exceeds average edge cost", "is_correct": False},
            {"text": "Linear with constant gradient equal to 1", "is_correct": False},
        ]
    },
    {
        "semester": 6,
        "course_id": "CS307",
        "subject_code": "CS307",
        "subject_name": "Cryptography & Information Security",
        "unit": 3,
        "topic": "RSA Asymmetric Cryptosystem",
        "type": "NUMERICAL",
        "prompt": "In RSA, given prime numbers p = 3 and q = 11, compute Euler's totient function phi(n).",
        "prompt_latex": r"\phi(n) = (p - 1)(q - 1)",
        "target_numeric": 20.0,
        "min_tolerance": 19.9,
        "max_tolerance": 20.1,
        "difficulty": "EASY",
        "bloom_level": "APPLY",
        "marks": 5.0,
        "negative_marks": 0.0,
        "tags": "crypto,rsa,euler-totient",
    },

    # --- SEMESTER 7 ---
    {
        "semester": 7,
        "course_id": "CS401",
        "subject_code": "CS401",
        "subject_name": "Distributed Systems & Cloud Infrastructure",
        "unit": 2,
        "topic": "Raft Consensus Protocol & Leader Election",
        "type": "SUBJECTIVE",
        "prompt": "Describe the leader election mechanism in the Raft distributed consensus protocol. Explain how randomized election timeouts prevent split-vote deadlocks.",
        "difficulty": "HARD",
        "bloom_level": "EVALUATE",
        "marks": 15.0,
        "negative_marks": 0.0,
        "tags": "distributed-systems,raft,consensus",
        "model_answer": "Follower converts to Candidate after heartbeat timeout. Increments term, votes for self, sends RequestVote RPC. Majority vote elects Leader.",
        "rubrics": [
            {"title": "Election Timeout Mechanism", "max_marks": 5.0, "description": "Heartbeat triggers and candidate transitions."},
            {"title": "Split Vote Prevention", "max_marks": 5.0, "description": "Randomized timeout distribution role."},
            {"title": "Log Matching & Safety Property", "max_marks": 5.0, "description": "Leader completeness and commit rules."},
        ]
    },
    {
        "semester": 7,
        "course_id": "CS402",
        "subject_code": "CS402",
        "subject_name": "Deep Learning & Computer Vision",
        "unit": 3,
        "topic": "Scaled Dot-Product Attention (Transformers)",
        "type": "MCQ_SINGLE",
        "prompt": "What is the mathematical formulation of Scaled Dot-Product Attention introduced in the Transformer architecture?",
        "prompt_latex": r"\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V",
        "difficulty": "MEDIUM",
        "bloom_level": "ANALYZE",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "deep-learning,transformers,attention",
        "options": [
            {"text": "softmax(Q * K^T / sqrt(d_k)) * V", "is_correct": True},
            {"text": "tanh(Q * K) * V / d_k", "is_correct": False},
            {"text": "sigmoid(Q^T * K) * V", "is_correct": False},
            {"text": "softmax(Q + K) * V / sqrt(d_k)", "is_correct": False},
        ]
    },

    # --- SEMESTER 8 ---
    {
        "semester": 8,
        "course_id": "CS405",
        "subject_code": "CS405",
        "subject_name": "Natural Language Processing & Large Language Models",
        "unit": 4,
        "topic": "Reinforcement Learning from Human Feedback (RLHF)",
        "type": "SUBJECTIVE",
        "prompt": "Detail the 3-stage alignment pipeline used for modern Large Language Models: (1) Pretraining, (2) Supervised Fine-Tuning (SFT), and (3) RLHF with PPO / DPO reward modeling.",
        "prompt_latex": r"\mathcal{L}_{\text{RLHF}} = \mathbb{E}\left[ R_\theta(x, y) - \beta \, \mathbb{D}_{\text{KL}}\left(\pi_\theta(y|x) \,||\, \pi_{\text{ref}}(y|x)\right) \right]",
        "difficulty": "HARD",
        "bloom_level": "CREATE",
        "marks": 15.0,
        "negative_marks": 0.0,
        "tags": "nlp,llm,rlhf,alignment",
        "model_answer": "Pretraining builds world knowledge. SFT teaches prompt-response format. RLHF trains reward model on human comparisons and optimizes policy with KL penalty.",
        "rubrics": [
            {"title": "Pipeline Stage Breakdown", "max_marks": 6.0, "description": "Accurate description of Pretraining, SFT, and RLHF."},
            {"title": "Reward Model Training", "max_marks": 5.0, "description": "Pairwise preference ranking and Bradley-Terry formulation."},
            {"title": "KL Divergence Penalty Purpose", "max_marks": 4.0, "description": "Preventing reward hacking and policy collapse."},
        ]
    },
    {
        "semester": 8,
        "course_id": "CS408",
        "subject_code": "CS408",
        "subject_name": "Blockchain Architectures, Smart Contracts & Web3",
        "unit": 1,
        "topic": "Cryptographic Hash Trees (Merkle Trees)",
        "type": "MCQ_SINGLE",
        "prompt": "What is the time complexity to verify that a specific transaction is included in a block using a Merkle tree with N total transactions?",
        "prompt_latex": r"T_{\text{verify}}(N) = \mathcal{O}(\log_2 N) \quad \text{hashes needed}",
        "difficulty": "EASY",
        "bloom_level": "UNDERSTAND",
        "marks": 5.0,
        "negative_marks": 1.0,
        "tags": "blockchain,merkle-tree,crypto",
        "options": [
            {"text": "O(log N)", "is_correct": True},
            {"text": "O(N)", "is_correct": False},
            {"text": "O(N log N)", "is_correct": False},
            {"text": "O(1)", "is_correct": False},
        ]
    }
]


async def seed_database():
    print("[SEED] Resetting database schema with 8 Semesters support...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("[SEED] Seeding University 10-Point Grading Policy...")
        policy = GradingPolicy(
            name="University UGC/AICTE Standard 10-Point Grade Policy",
            description="Autonomous Engineering College relative and absolute grading scale.",
            mode="ABSOLUTE",
            moderation_allowed=True,
            grace_marks_cap=5.0,
            is_active=True
        )
        db.add(policy)
        await db.flush()

        cutoffs_data = [
            ("O", 10.0, 90.0, "Outstanding"),
            ("A+", 9.0, 80.0, "Excellent"),
            ("A", 8.0, 70.0, "Very Good"),
            ("B+", 7.0, 60.0, "Good"),
            ("B", 6.0, 50.0, "Above Average"),
            ("C", 5.0, 40.0, "Pass / Average"),
            ("F", 0.0, 0.0, "Fail"),
        ]
        created_cutoffs = []
        for letter, pt, min_pct, desc in cutoffs_data:
            c = GradeCutoff(
                policy_id=policy.id,
                grade_letter=letter,
                grade_point=pt,
                min_percentage=min_pct,
                description=desc
            )
            db.add(c)
            created_cutoffs.append(c)

        print("[SEED] Seeding Question Bank across all 8 Semesters...")
        questions_by_semester = {}
        for q_data in SEMESTER_QUESTIONS:
            sem = q_data["semester"]
            q = Question(
                course_id=q_data["course_id"],
                subject_code=q_data["subject_code"],
                subject_name=q_data["subject_name"],
                semester=sem,
                unit=q_data["unit"],
                topic=q_data["topic"],
                type=q_data["type"],
                prompt=q_data["prompt"],
                prompt_latex=q_data.get("prompt_latex"),
                model_answer=q_data.get("model_answer"),
                target_numeric=q_data.get("target_numeric"),
                min_tolerance=q_data.get("min_tolerance"),
                max_tolerance=q_data.get("max_tolerance"),
                difficulty=q_data["difficulty"],
                bloom_level=q_data["bloom_level"],
                marks=q_data["marks"],
                negative_marks=q_data["negative_marks"],
                tags=q_data["tags"],
                status="APPROVED"
            )
            db.add(q)
            await db.flush()

            if "options" in q_data:
                for opt in q_data["options"]:
                    db.add(QuestionOption(
                        question_id=q.id,
                        text=opt["text"],
                        latex=opt.get("latex"),
                        is_correct=opt["is_correct"]
                    ))

            if "rubrics" in q_data:
                for rub in q_data["rubrics"]:
                    db.add(RubricCriterion(
                        question_id=q.id,
                        title=rub["title"],
                        max_marks=rub["max_marks"],
                        description=rub.get("description")
                    ))

            if sem not in questions_by_semester:
                questions_by_semester[sem] = []
            questions_by_semester[sem].append(q)

        print("[SEED] Seeding Examinations and Student Cohorts for Semesters 1 to 8...")
        students_roster = [
            ("22CS101", "Aarav Sharma", "Computer Science"),
            ("22CS102", "Diya Patel", "Computer Science"),
            ("22CS103", "Rohan Verma", "Computer Science"),
            ("22CS104", "Ananya Iyer", "Computer Science"),
            ("22CS105", "Kabir Nair", "Computer Science"),
            ("22CS106", "Sneha Rao", "Information Technology"),
            ("22CS107", "Ishaan Gupta", "Computer Science"),
            ("22CS108", "Meera Kulkarni", "Computer Science"),
            ("22CS109", "Arjun Reddy", "Information Technology"),
            ("22CS110", "Pooja Hegde", "Computer Science"),
            ("22CS111", "Vikram Malhotra", "Computer Science"),
            ("22CS112", "Tanvi Joshi", "Computer Science"),
            ("22CS113", "Siddharth Das", "Computer Science"),
            ("22CS114", "Rhea Sengupta", "Information Technology"),
            ("22CS115", "Aditya Deshmukh", "Computer Science"),
            ("22CS116", "Kavya Menon", "Computer Science"),
            ("22CS117", "Gaurav Bansal", "Computer Science"),
            ("22CS118", "Ritu Chauhan", "Information Technology"),
            ("22CS119", "Nikhil Pillai", "Computer Science"),
            ("22CS120", "Zoya Khan", "Computer Science"),
            ("22CS121", "Manish Tiwari", "Computer Science"),
            ("22CS122", "Bhavna Jain", "Computer Science"),
            ("22CS123", "Sameer Bhat", "Information Technology"),
            ("22CS124", "Pallavi Roy", "Computer Science"),
            ("22CS125", "Harshavardhan Rao", "Computer Science"),
        ]

        semester_names = {
            1: "Freshman Engineering Physics & Computing Exam",
            2: "OOP & Electronic Circuit Foundations Exam",
            3: "Data Structures & Computer Architecture Exam",
            4: "Operating Systems & Database Systems Exam",
            5: "Algorithms & Computer Networks Comprehensive Exam",
            6: "Artificial Intelligence & Compiler Design Exam",
            7: "Distributed Cloud Systems & Deep Learning Exam",
            8: "NLP, Cyber Forensics & Blockchain Capstone Exam",
        }

        random.seed(42)

        for sem in range(1, 9):
            sem_qs = questions_by_semester.get(sem, [])
            total_marks = sum(q.marks for q in sem_qs) if sem_qs else 50.0
            passing_marks = round(total_marks * 0.4, 1)

            exam = Exam(
                title=f"Semester {sem} — {semester_names[sem]}",
                exam_code=f"EXAM-2026-CS-SEM{sem}",
                department="Computer Science & Engineering",
                semester=sem,
                academic_year="2025-2026",
                duration_minutes=180,
                total_marks=total_marks,
                passing_marks=passing_marks,
                status="PUBLISHED",
                instructions="Scientific calculators permitted. Answer all questions."
            )
            db.add(exam)
            await db.flush()

            for idx, q in enumerate(sem_qs):
                db.add(ExamQuestion(
                    exam_id=exam.id,
                    question_id=q.id,
                    section="Section A" if q.marks <= 5 else "Section B",
                    order_index=idx + 1,
                    marks=q.marks
                ))

            # Seed 25 student submissions for this exam
            created_submissions = []
            for s_idx, (roll, name, dept) in enumerate(students_roster):
                perf = min(0.98, max(0.35, random.gauss(0.72, 0.15)))
                sub = StudentSubmission(
                    exam_id=exam.id,
                    student_id=f"stu_sem{sem}_{s_idx + 1:03d}",
                    roll_number=roll,
                    student_name=name,
                    department=dept,
                    email=f"{roll.lower()}@college.edu",
                    status="EVALUATED"
                )
                db.add(sub)
                await db.flush()

                raw_total = 0.0
                for q in sem_qs:
                    marks_scored = round(min(q.marks, max(0.0, q.marks * random.uniform(perf * 0.82, min(1.0, perf * 1.18)))), 1)
                    ans = StudentAnswer(
                        submission_id=sub.id,
                        question_id=q.id,
                        marks_obtained=marks_scored,
                        max_marks=q.marks,
                        is_evaluated=True,
                        evaluator_feedback="Evaluated as per standard rubric guidelines."
                    )
                    raw_total += marks_scored
                    db.add(ans)

                sub.raw_score = round(raw_total, 2)
                sub.final_score = round(raw_total, 2)
                created_submissions.append(sub)

            # Calculate grades and percentiles
            calculate_grades_for_submissions(
                submissions=created_submissions,
                total_marks=exam.total_marks,
                passing_marks=exam.passing_marks,
                policy=policy,
                cutoffs=created_cutoffs,
                moderation_marks=1.5,
                apply_relative_curve=False
            )
            compute_percentiles_and_ranks(created_submissions)

        await db.commit()
        print("[SUCCESS] All 8 Semesters seeded with distinct subjects, exams, and student analytics!")


if __name__ == "__main__":
    asyncio.run(seed_database())
