
DO $$ 
DECLARE
  v_admin_id bigint;
  v_researcher_id bigint;
  v_blog_id bigint;
  v_pub_id bigint;
BEGIN
  -- Get Member IDs from Auth UUIDs
  SELECT id INTO v_admin_id FROM member WHERE auth_user_id = 'd9bb30fe-79d1-4997-832c-072cb73c1e74';
  SELECT id INTO v_researcher_id FROM member WHERE auth_user_id = '1b87068e-07b9-4c9a-965a-cbd3f03eb6d0';

  IF v_admin_id IS NULL OR v_researcher_id IS NULL THEN
     RAISE NOTICE 'Admin or Researcher member not found in database. Seed skipped.';
     RETURN;
  END IF;

  RAISE NOTICE 'Using Admin ID: % and Researcher ID: %', v_admin_id, v_researcher_id;


  INSERT INTO blog (title, description, content, created_by_member_id, approval_status, approved_by_admin_id) 
  VALUES ('Where Neurons Meet Networks: Current Frontiers at the Intersection of Brain Science and Artificial Intelligence', 'At BrAIN Labs, our work sits at the convergence of two of the most complex systems ever studied: the human brain and artificial intelligence. As we move through 2026, the boundary between these disciplines is dissolving — not as a philosophical observation, but as a measurable scientific reality.', '
At BrAIN Labs, our work sits at the convergence of two of the most complex systems ever studied: the human brain and artificial intelligence. As we move through 2026, the boundary between these disciplines is dissolving — not as a philosophical observation, but as a measurable scientific reality. This article presents our perspective on the five research frontiers we consider most significant, several of which directly intersect with our ongoing work.

### 1. Neuromorphic Computing: From Theoretical Promise to Engineering Reality

For decades, neuromorphic computing occupied a fascinating but peripheral space in the broader AI landscape — compelling in principle, elusive in practice. That position has fundamentally shifted.

Neuromorphic architectures, designed around the organizational principles of biological neural circuits, are now demonstrating capabilities once reserved for energy-intensive supercomputing infrastructure. Recent work has shown these systems solving complex partial differential equations underpinning weather modeling, fluid dynamics, and nuclear simulation — domains previously inaccessible to brain-inspired hardware.

What makes this particularly significant from a computational neuroscience standpoint is that the algorithms enabling these breakthroughs closely reflect the structure of cortical networks. The mathematical relationship between biological neural computation and applied problem-solving has not merely been an analogy — it appears to have been an engineering blueprint.

### 2. Spiking Neural Networks: Precision, Efficiency, and Biological Fidelity

Standard deep learning architectures operate through continuous, always-active computation. Biological neurons operate on an entirely different principle: they remain silent until a stimulus crosses a threshold, then communicate through discrete electrical pulses — spikes — before returning to rest. Spiking Neural Networks (SNNs) replicate this event-driven paradigm, and the computational efficiency gains that result are substantial.

Recent advances in SNN research have introduced neuron models that account simultaneously for spike morphology and spike timing — allowing energy-efficient spiking architectures to incorporate the supervised learning techniques that have driven mainstream AI progress. This represents a meaningful step toward closing the performance gap between SNNs and conventional deep networks, without sacrificing the efficiency advantages that make SNNs so attractive for real-world deployment.

### 3. Neuromorphic Materials: When Learning Is Encoded in Matter Itself

Among the least widely reported but most consequential developments in this space is the convergence of materials science and neuromorphic engineering.

Researchers have recently demonstrated molecular-scale devices whose electrical and computational behavior can be tuned across multiple parameters — effectively combining memory storage and active computation within a single material system. This moves neuromorphic hardware beyond the question of *how to simulate* learning in silicon, toward the more profound question of *how to embody* learning in the physical structure of a device.

### 4. Brain-Computer Interfaces: Crossing from Prototype to Clinical Practice

Perhaps no development more viscerally illustrates the convergence of brain science and AI than the clinical maturation of brain-computer interfaces (BCIs).

Recent collaborative work across Columbia University, Stanford, NYU, and the University of Pennsylvania produced BISC — the Biological Interface System to Cortex — a fully wireless BCI built on a single silicon chip integrating 65,536 electrodes across 1,024 channels, with real-time neural data streaming capability. The technical specifications alone represent a generational leap from prior implantable systems.

### 5. The NeuroAI Dialogue: Mutual Illumination Between Brain Science and Machine Intelligence

Underlying all of the above is a deepening theoretical exchange between neuroscience and AI research — one that is increasingly bidirectional.

Leading research groups argue that the next meaningful advances in AI will require not merely scaling existing architectures, but incorporating structural and functional insights from biological neural systems. The brain does not simply store information — it organizes knowledge relationally, updates representations dynamically, and generalizes from minimal examples. These are precisely the capabilities where current AI systems remain weakest.

---

BrAIN Labs is a research laboratory at the intersection of Artificial Intelligence, Machine Learning, and Neuroscience.
We welcome research collaborations, scholarly exchange, and community engagement.
        ', v_researcher_id, 'APPROVED', v_admin_id)
  RETURNING id INTO v_blog_id;
    INSERT INTO blog_image (blog_id, image_url) VALUES (v_blog_id, '/assets/images/blog1.png');
  INSERT INTO blog_keyword (blog_id, keyword) VALUES (v_blog_id, 'Artificial Intelligence');
  INSERT INTO blog_keyword (blog_id, keyword) VALUES (v_blog_id, 'Neuroscience');
  INSERT INTO blog_keyword (blog_id, keyword) VALUES (v_blog_id, 'Neuromorphic Computing');

  INSERT INTO event (title, description, event_date, approval_status, created_by_researcher, approved_by_admin_id)
  VALUES ('TinyML: A Compact Revolution in Engineering AI', 'MERCon (Moratuwa Engineering Research Conference)', '2025-07-31', 'APPROVED', v_researcher_id, v_admin_id);
  
  INSERT INTO event (title, description, event_date, approval_status, created_by_researcher, approved_by_admin_id)
  VALUES ('All Roads Lead to TinyML: The Rome of Efficient Machine Learning in Engineering', 'SICET (SLIIT International Conference on Engineering and Technology)', '2025-07-31', 'APPROVED', v_researcher_id, v_admin_id);
  
  INSERT INTO grant_info (title, description, passed_date, expire_date, approval_status, created_by_researcher, approved_by_admin_id)
  VALUES ('Brain-Inspired AI for Sustainable Computing', 'Research into energy-efficient diverse AI architectures inspired by neural dynamics.', '2025-01-01', '2026-01-01', 'APPROVED', v_researcher_id, v_admin_id);
  
  INSERT INTO project (title, description, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Optimized Compression for Transformers', 'Designing efficient techniques to reduce the size and computational requirements of transformer-based models while maintaining their accuracy. This work focuses on model pruning, quantization, and other compression methods to enhance scalability and deployment on resource-constrained systems.', 'APPROVED', v_researcher_id, v_admin_id);
    
  INSERT INTO project (title, description, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Security and Privacy of LLM', 'Investigating vulnerabilities in large language models and developing robust solutions to mitigate risks, including adversarial attacks, data leakage, and model misuse. This ensures LLMs can operate securely in sensitive applications, such as healthcare and finance.', 'APPROVED', v_researcher_id, v_admin_id);
    
  INSERT INTO project (title, description, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Applications of LLM for Cybersecurity', 'Utilizing the advanced reasoning and pattern recognition capabilities of LLMs to detect and mitigate cyber threats. Applications include automated threat intelligence, phishing detection, and generating secure coding recommendations to prevent vulnerabilities.', 'APPROVED', v_researcher_id, v_admin_id);
    
  INSERT INTO project (title, description, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Learning Algorithms for Spiking Neural Networks (SNN)', 'Developing algorithms tailored to SNNs, which emulate the biological neuron spiking process. These algorithms focus on event-driven learning paradigms, enabling real-time processing with low energy consumption, suitable for edge AI systems.', 'APPROVED', v_researcher_id, v_admin_id);
    
  INSERT INTO project (title, description, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Applications of SNN', 'Exploring the use of SNNs in robotics, prosthetics, and neuromorphic hardware. These applications leverage the brain-inspired efficiency of SNNs to enable adaptive, low-power solutions for real-world problems, including speech recognition and autonomous navigation.', 'APPROVED', v_researcher_id, v_admin_id);
    
  INSERT INTO publication (title, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Mental Stress Recognition on the Fly Using SNNs', 'APPROVED', v_researcher_id, v_admin_id)
  RETURNING id INTO v_pub_id;
  
  INSERT INTO journal (publication_id, link, description)
  VALUES (v_pub_id, 'https://doi.org/10.21203/rs.3.rs-1841009/v1', 'M. Weerasinghe, G. Y. Wang, J. Whalley, M. Crook-Ramsey | Nature Scientific Reports');
  
  INSERT INTO publication (title, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Ensemble Plasticity and Network Adaptability in SNNs', 'APPROVED', v_researcher_id, v_admin_id)
  RETURNING id INTO v_pub_id;
  
  INSERT INTO journal (publication_id, link, description)
  VALUES (v_pub_id, 'https://arxiv.org/abs/2203.07039', 'M. Weerasinghe, D. Parry, G. Y. Wang, J. Whalley | ArXiv Preprint');
  
  INSERT INTO publication (title, approval_status, created_by_member_id, approved_by_admin_id)
  VALUES ('Incorporating Structural Plasticity Approaches in Spiking Neural Networks for EEG Modelling', 'APPROVED', v_researcher_id, v_admin_id)
  RETURNING id INTO v_pub_id;
  
  INSERT INTO journal (publication_id, link, description)
  VALUES (v_pub_id, 'https://doi.org/10.1109/ACCESS.2021.3099492', 'M. Weerasinghe, J. I. Espinosa-Ramos, G. Y. Wang, D. Parry | IEEE Access');
  
END $$;
