export interface SubjectInfo {
  code: string;
  name: string;
  courseId: string;
  credits: number;
  description: string;
}

export interface SemesterInfo {
  semester: number;
  title: string;
  year: string;
  subjects: SubjectInfo[];
}

export const CURRICULUM_SEMESTERS: SemesterInfo[] = [
  {
    semester: 1,
    title: 'Semester 1 — Freshman Foundations',
    year: 'Year 1',
    subjects: [
      { code: 'CS101', name: 'Programming for Problem Solving (Python & C)', courseId: 'CS101', credits: 4, description: 'Control flow, functions, memory, recursion, pointers' },
      { code: 'MATH101', name: 'Linear Algebra & Single Variable Calculus', courseId: 'MATH101', credits: 4, description: 'Matrices, eigenvalues, infinite series, Taylor polynomials' },
      { code: 'PHY101', name: 'Engineering Physics & Quantum Optics', courseId: 'PHY101', credits: 4, description: 'Wave mechanics, Schrödinger equation, lasers, fiber optics' },
      { code: 'ENG101', name: 'Technical English & Professional Communication', courseId: 'ENG101', credits: 2, description: 'Technical documentation, executive presentations' }
    ]
  },
  {
    semester: 2,
    title: 'Semester 2 — Hardware & Object Fundamentals',
    year: 'Year 1',
    subjects: [
      { code: 'CS102', name: 'Object-Oriented Programming (Java & C++)', courseId: 'CS102', credits: 4, description: 'Encapsulation, inheritance, polymorphism, templates, STL' },
      { code: 'MATH102', name: 'Multivariable Calculus & Differential Equations', courseId: 'MATH102', credits: 4, description: 'Multiple integrals, Green-Stokes theorems, ODEs, PDEs' },
      { code: 'ECE101', name: 'Digital Logic & Electronic Circuit Design', courseId: 'ECE101', credits: 4, description: 'Boolean algebra, K-maps, sequential circuits, flip-flops' },
      { code: 'ENV101', name: 'Environmental Science & Sustainability Engineering', courseId: 'ENV101', credits: 2, description: 'Ecosystems, renewable energy, environmental policies' }
    ]
  },
  {
    semester: 3,
    title: 'Semester 3 — Core Computing Structures',
    year: 'Year 2',
    subjects: [
      { code: 'CS201', name: 'Data Structures & Algorithms', courseId: 'CS201', credits: 4, description: 'Trees, balanced AVL/Red-Black trees, heaps, graphs, hashing' },
      { code: 'CS202', name: 'Discrete Mathematics & Graph Theory', courseId: 'CS202', credits: 4, description: 'Propositional logic, set theory, combinatorics, graph theory' },
      { code: 'CS203', name: 'Computer Organization & Architecture', courseId: 'CS203', credits: 4, description: 'Instruction sets, pipelining, cache hierarchy, memory design' },
      { code: 'MATH201', name: 'Probability, Statistics & Stochastic Processes', courseId: 'MATH201', credits: 4, description: 'Random variables, Bayesian inference, hypothesis testing' }
    ]
  },
  {
    semester: 4,
    title: 'Semester 4 — Systems & Theoretical Computing',
    year: 'Year 2',
    subjects: [
      { code: 'CS204', name: 'Operating Systems & Kernel Programming', courseId: 'CS204', credits: 4, description: 'Process scheduling, deadlocks, virtual memory, UNIX POSIX' },
      { code: 'CS205', name: 'Database Management Systems (DBMS)', courseId: 'CS205', credits: 4, description: 'Relational algebra, SQL, normal forms, ACID, B+ Trees' },
      { code: 'CS206', name: 'Theory of Computation & Automata Theory', courseId: 'CS206', credits: 4, description: 'DFA/NFA, context-free grammars, Turing machines, decidability' },
      { code: 'CS207', name: 'Software Engineering & Agile Methodologies', courseId: 'CS207', credits: 3, description: 'UML diagrams, design patterns, CI/CD, Scrum framework' }
    ]
  },
  {
    semester: 5,
    title: 'Semester 5 — Advanced Algorithms & Networks',
    year: 'Year 3',
    subjects: [
      { code: 'CS301', name: 'Design & Analysis of Algorithms', courseId: 'CS301', credits: 4, description: 'Greedy algorithms, dynamic programming, max flow, NP-completeness' },
      { code: 'CS302', name: 'Computer Networks & Internet Protocols', courseId: 'CS302', credits: 4, description: 'OSI stack, TCP/IP, routing algorithms, DNS, HTTP/3, TLS' },
      { code: 'CS303', name: 'Embedded Systems & Microcontroller Programming', courseId: 'CS303', credits: 3, description: 'ARM Cortex, timers, interrupts, real-time operating systems' },
      { code: 'CS304', name: 'Full-Stack Web Technologies & Cloud Systems', courseId: 'CS304', credits: 3, description: 'React, Node, REST APIs, Microservices, AWS fundamentals' }
    ]
  },
  {
    semester: 6,
    title: 'Semester 6 — AI, Security & Language Processors',
    year: 'Year 3',
    subjects: [
      { code: 'CS305', name: 'Compiler Design & Language Optimization', courseId: 'CS305', credits: 4, description: 'Lexical analysis, LL/LR parsing, semantic analysis, code generation' },
      { code: 'CS306', name: 'Artificial Intelligence & Knowledge Systems', courseId: 'CS306', credits: 4, description: 'Heuristic search, A* algorithm, game theory, CSP, logic agents' },
      { code: 'CS307', name: 'Cryptography & Information Security', courseId: 'CS307', credits: 4, description: 'AES, RSA, elliptic curve, zero-knowledge proofs, hashing' },
      { code: 'CS308', name: 'Machine Learning & Statistical Modeling', courseId: 'CS308', credits: 4, description: 'Supervised/unsupervised, SVM, gradient boosting, clustering' }
    ]
  },
  {
    semester: 7,
    title: 'Semester 7 — Distributed Systems & Deep Learning',
    year: 'Year 4',
    subjects: [
      { code: 'CS401', name: 'Distributed Systems & Cloud Infrastructure', courseId: 'CS401', credits: 4, description: 'Consensus (Raft/Paxos), MapReduce, vector clocks, Kubernetes' },
      { code: 'CS402', name: 'Deep Learning & Computer Vision', courseId: 'CS402', credits: 4, description: 'CNNs, Transformers, attention mechanisms, object detection' },
      { code: 'CS403', name: 'Big Data Analytics & Stream Processing', courseId: 'CS403', credits: 4, description: 'Hadoop, Apache Spark, Kafka streams, NoSQL data modeling' },
      { code: 'CS404', name: 'Internet of Things (IoT) & Edge Computing', courseId: 'CS404', credits: 3, description: 'MQTT protocol, edge sensor networks, low-power mesh' }
    ]
  },
  {
    semester: 8,
    title: 'Semester 8 — Emerging Technologies & Capstone',
    year: 'Year 4',
    subjects: [
      { code: 'CS405', name: 'Natural Language Processing & Large Language Models', courseId: 'CS405', credits: 4, description: 'Transformers, BERT, GPT, RLHF, tokenization, semantic search' },
      { code: 'CS406', name: 'Cyber Forensics, Penetration Testing & Ethical Hacking', courseId: 'CS406', credits: 4, description: 'Vulnerability assessment, buffer overflows, malware reverse engineering' },
      { code: 'CS407', name: 'High-Performance Computing & GPU Programming (CUDA)', courseId: 'CS407', credits: 4, description: 'Parallel computing, OpenMP, MPI, NVIDIA CUDA kernels' },
      { code: 'CS408', name: 'Blockchain Architectures, Smart Contracts & Web3', courseId: 'CS408', credits: 3, description: 'EVM, Solidity, consensus protocols, decentralization' }
    ]
  }
];

export function getSubjectsForSemester(semester: number): SubjectInfo[] {
  const sem = CURRICULUM_SEMESTERS.find((s) => s.semester === semester);
  return sem ? sem.subjects : [];
}

export function getAllSubjects(): SubjectInfo[] {
  return CURRICULUM_SEMESTERS.flatMap((s) => s.subjects);
}
