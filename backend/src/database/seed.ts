import db, { createTables } from './schema';

export function dropTables(): void {
  db.exec(`
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS requests;
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS projects;
    DROP TABLE IF EXISTS faculty;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS equipment;
  `);
}

export function seedDatabase(): void {
  dropTables();
  createTables();

  // ─── EQUIPMENT ─────────────────────────────────────────────────────────────
  const insertEquipment = db.prepare(`
    INSERT INTO equipment (id, name, category, department, lab, description, specs, status, hourly_rate, max_duration, requires_approval, demand_score)
    VALUES (@id, @name, @category, @department, @lab, @description, @specs, @status, @hourly_rate, @max_duration, @requires_approval, @demand_score)
  `);

  const equipmentData = [
    { id:'eq-001', name:'NVIDIA RTX 4090 GPU Workstation', category:'Computing', department:'CS Department', lab:'CS Lab A', description:'High-performance GPU workstation for deep learning and AI research.', specs:JSON.stringify({VRAM:'24GB',GPU:'RTX4090',RAM:'64GB',CUDA:'12.0'}), status:'available', hourly_rate:5, max_duration:480, requires_approval:0, demand_score:0.92 },
    { id:'eq-002', name:'NVIDIA RTX 3080 GPU Workstation', category:'Computing', department:'CS Department', lab:'CS Lab B', description:'Mid-range GPU workstation for ML experiments.', specs:JSON.stringify({VRAM:'12GB',GPU:'RTX3080',RAM:'32GB',CUDA:'12.0'}), status:'available', hourly_rate:3, max_duration:480, requires_approval:0, demand_score:0.65 },
    { id:'eq-003', name:'Jetson Orin Nano Developer Kit', category:'AI/ML', department:'ECE Department', lab:'Robotics Lab', description:'Edge AI development platform.', specs:JSON.stringify({CPU:'6-core',RAM:'8GB',GPU:'1024-CUDA','AI-TOPS':'40'}), status:'available', hourly_rate:2, max_duration:360, requires_approval:0, demand_score:0.78 },
    { id:'eq-004', name:'Raspberry Pi 5 Kit (5 units)', category:'IoT', department:'ECE Department', lab:'Electronics Lab', description:'Versatile SBC kits for IoT and embedded projects.', specs:JSON.stringify({CPU:'ARM-Cortex-A76',RAM:'8GB',GPIO:'40pin'}), status:'available', hourly_rate:1, max_duration:720, requires_approval:0, demand_score:0.55 },
    { id:'eq-005', name:'Arduino Mega 2560 Development Kit', category:'Electronics', department:'ECE Department', lab:'Electronics Lab', description:'Full-featured Arduino kits for electronics prototyping.', specs:JSON.stringify({MCU:'ATmega2560',GPIO:'54',ADC:'16'}), status:'available', hourly_rate:1, max_duration:720, requires_approval:0, demand_score:0.45 },
    { id:'eq-006', name:'Oscilloscope Rigol DS1104Z', category:'Electronics', department:'ECE Department', lab:'Electronics Lab', description:'4-channel 100MHz digital oscilloscope.', specs:JSON.stringify({Channels:'4',Bandwidth:'100MHz',SampleRate:'1GSa/s'}), status:'in-use', hourly_rate:2, max_duration:240, requires_approval:0, demand_score:0.60 },
    { id:'eq-007', name:'Logic Analyzer Saleae Logic Pro 16', category:'Electronics', department:'ECE Department', lab:'Electronics Lab', description:'Professional 16-channel logic analyzer.', specs:JSON.stringify({Channels:'16',MaxRate:'500MHz'}), status:'available', hourly_rate:2, max_duration:240, requires_approval:0, demand_score:0.40 },
    { id:'eq-008', name:'Bambu Lab X1C 3D Printer', category:'3D Printing', department:'Mech Department', lab:'Fabrication Lab', description:'High-speed multi-material 3D printer.', specs:JSON.stringify({Speed:'500mm/s',Materials:'PLA+PETG+ABS+TPU'}), status:'in-use', hourly_rate:3, max_duration:1440, requires_approval:0, demand_score:0.85 },
    { id:'eq-009', name:'Prusa MK4 3D Printer', category:'3D Printing', department:'Mech Department', lab:'Fabrication Lab', description:'Reliable FDM 3D printer for prototyping.', specs:JSON.stringify({Speed:'200mm/s',Materials:'PLA+PETG'}), status:'available', hourly_rate:2, max_duration:1440, requires_approval:0, demand_score:0.50 },
    { id:'eq-010', name:'Universal Robots UR5e Robotic Arm', category:'Robotics', department:'Mech Department', lab:'Robotics Lab', description:'Collaborative 6-DOF robotic arm for research.', specs:JSON.stringify({Payload:'5kg',Reach:'850mm'}), status:'available', hourly_rate:8, max_duration:240, requires_approval:1, demand_score:0.75 },
    { id:'eq-011', name:'DJI RoboMaster EP Core', category:'Robotics', department:'CS Department', lab:'Robotics Lab', description:'Educational robotic platform with AI capabilities.', specs:JSON.stringify({Vision:'AI',Motors:'4',Sensors:'12'}), status:'available', hourly_rate:3, max_duration:300, requires_approval:0, demand_score:0.68 },
    { id:'eq-012', name:'Xilinx Artix-7 FPGA Dev Board', category:'Electronics', department:'ECE Department', lab:'Electronics Lab', description:'Mid-range FPGA development board for digital design.', specs:JSON.stringify({LUTs:'33280',DSP:'90',Freq:'450MHz'}), status:'available', hourly_rate:2, max_duration:480, requires_approval:0, demand_score:0.55 },
    { id:'eq-013', name:'Meta Quest 3 VR Headset', category:'Computing', department:'CS Department', lab:'Innovation Lab', description:'Standalone mixed-reality headset.', specs:JSON.stringify({Resolution:'2064x2208',FOV:'110deg'}), status:'available', hourly_rate:4, max_duration:180, requires_approval:0, demand_score:0.72 },
    { id:'eq-014', name:'FLIR Lepton Thermal Camera', category:'Research', department:'Research Dept', lab:'Research Lab', description:'Compact longwave infrared thermal camera module.', specs:JSON.stringify({Resolution:'160x120',Temp:'-10to400C'}), status:'available', hourly_rate:3, max_duration:360, requires_approval:0, demand_score:0.48 },
    { id:'eq-015', name:'PCB Prototyping Station LPKF', category:'Electronics', department:'ECE Department', lab:'Fabrication Lab', description:'Professional PCB milling machine.', specs:JSON.stringify({Resolution:'0.1mm',DrillDia:'0.3mm'}), status:'maintenance', hourly_rate:4, max_duration:480, requires_approval:0, demand_score:0.35 },
    { id:'eq-016', name:'HPC Server 64-core 256GB', category:'Computing', department:'CS Department', lab:'HPC Lab', description:'High-performance compute server for large-scale simulations.', specs:JSON.stringify({CPU:'64-core',RAM:'256GB',Storage:'10TB',GPU:'None'}), status:'available', hourly_rate:6, max_duration:1440, requires_approval:0, demand_score:0.58 },
    { id:'eq-017', name:'STM32 Nucleo Dev Board (8 units)', category:'Electronics', department:'ECE Department', lab:'Electronics Lab', description:'ARM Cortex-M4 development boards for embedded systems.', specs:JSON.stringify({MCU:'STM32F4',Clock:'168MHz'}), status:'available', hourly_rate:1, max_duration:720, requires_approval:0, demand_score:0.50 },
    { id:'eq-018', name:'Velodyne VLP-16 LiDAR', category:'Robotics', department:'Research Dept', lab:'Robotics Lab', description:'16-channel 3D LiDAR sensor for autonomous navigation.', specs:JSON.stringify({Points:'300000/s',Range:'100m'}), status:'available', hourly_rate:10, max_duration:300, requires_approval:1, demand_score:0.80 },
    { id:'eq-019', name:'R&S FPC1000 Spectrum Analyzer', category:'Research', department:'ECE Department', lab:'Research Lab', description:'Portable spectrum analyzer for RF signal analysis.', specs:JSON.stringify({Freq:'5kHz-3GHz',Span:'10Hz-3GHz'}), status:'available', hourly_rate:5, max_duration:360, requires_approval:0, demand_score:0.42 },
    { id:'eq-020', name:'Intel RealSense D455 Camera', category:'AI/ML', department:'CS Department', lab:'AI Lab', description:'Depth and RGB camera for computer vision research.', specs:JSON.stringify({RGB:'1280x720',Depth:'1280x720',Range:'0.6-6m'}), status:'available', hourly_rate:2, max_duration:480, requires_approval:0, demand_score:0.65 },
    { id:'eq-021', name:'CNC Milling Machine (Haas Mini Mill)', category:'Mechanical', department:'Mech Department', lab:'Machine Shop', description:'CNC vertical machining center for precision metal and plastic parts.', specs:JSON.stringify({Travel:'406x356x356mm',Spindle:'15000RPM',ToolChanger:'10 tools'}), status:'available', hourly_rate:30, max_duration:360, requires_approval:1, demand_score:0.67 },
  ];

  for (const eq of equipmentData) {
    insertEquipment.run(eq);
  }

  // ─── STUDENTS ───────────────────────────────────────────────────────────────
  const insertStudent = db.prepare(`
    INSERT INTO students (id, name, email, department, year, booking_count)
    VALUES (@id, @name, @email, @department, @year, @booking_count)
  `);

  const students = [
    { id:'st-001', name:'Alex Morgan', email:'alex.morgan@university.edu', department:'Computer Science', year:'Year 3', booking_count:5 },
    { id:'st-002', name:'Priya Patel', email:'priya.patel@university.edu', department:'Electrical Engineering', year:'Year 4', booking_count:3 },
    { id:'st-003', name:'Marcus Chen', email:'marcus.chen@university.edu', department:'Mechanical Engineering', year:'Year 2', booking_count:2 },
    { id:'st-004', name:'Aisha Johnson', email:'aisha.johnson@university.edu', department:'Computer Science', year:'Year 3', booking_count:4 },
    { id:'st-005', name:'Ravi Kumar', email:'ravi.kumar@university.edu', department:'ECE', year:'Year 4', booking_count:6 },
    { id:'st-006', name:'Sofia Rodriguez', email:'sofia.rodriguez@university.edu', department:'Computer Science', year:'Year 2', booking_count:1 },
    { id:'st-007', name:'James Wilson', email:'james.wilson@university.edu', department:'Mechanical Engineering', year:'Year 3', booking_count:2 },
    { id:'st-008', name:'Mei Lin', email:'mei.lin@university.edu', department:'Computer Science', year:'Year 4', booking_count:7 },
    { id:'st-009', name:'Omar Hassan', email:'omar.hassan@university.edu', department:'ECE', year:'Year 3', booking_count:3 },
    { id:'st-010', name:'Emma Davies', email:'emma.davies@university.edu', department:'Research', year:'PhD-2', booking_count:8 },
  ];
  for (const s of students) insertStudent.run(s);

  // ─── FACULTY ────────────────────────────────────────────────────────────────
  const insertFaculty = db.prepare(`
    INSERT INTO faculty (id, name, email, department, title)
    VALUES (@id, @name, @email, @department, @title)
  `);

  const faculty = [
    { id:'fac-001', name:'Dr. Sarah Chen', email:'sarah.chen@university.edu', department:'Computer Science', title:'Associate Professor' },
    { id:'fac-002', name:'Dr. Rajesh Kumar', email:'rajesh.kumar@university.edu', department:'Electrical Engineering', title:'Professor' },
    { id:'fac-003', name:'Dr. Lisa Park', email:'lisa.park@university.edu', department:'Mechanical Engineering', title:'Assistant Professor' },
    { id:'fac-004', name:'Dr. Michael Torres', email:'michael.torres@university.edu', department:'Research', title:'Research Director' },
    { id:'fac-005', name:'Dr. Fatima Al-Rashid', email:'fatima.alrashid@university.edu', department:'Computer Science', title:'Professor' },
  ];
  for (const f of faculty) insertFaculty.run(f);

  // ─── PROJECTS ───────────────────────────────────────────────────────────────
  const insertProject = db.prepare(`
    INSERT INTO projects (id, student_id, title, description, department, deadline, status, team_members, progress, required_equipment)
    VALUES (@id, @student_id, @title, @description, @department, @deadline, @status, @team_members, @progress, @required_equipment)
  `);

  const projects = [
    { id:'proj-001', student_id:'st-001', title:'Autonomous Drone Navigation', description:'Building an AI-based autonomous drone navigation system using computer vision.', department:'Computer Science', deadline:'2026-12-15', status:'active', team_members:JSON.stringify(['st-001']), progress:0.65, required_equipment:JSON.stringify(['eq-001','eq-003','eq-018','eq-020']) },
    { id:'proj-002', student_id:'st-004', title:'AI Waste Classification', description:'Deep learning system for automated waste classification and sorting.', department:'Computer Science', deadline:'2026-12-01', status:'active', team_members:JSON.stringify(['st-004']), progress:0.40, required_equipment:JSON.stringify(['eq-001','eq-020','eq-003']) },
    { id:'proj-003', student_id:'st-002', title:'Smart Energy Monitoring', description:'IoT-based real-time energy monitoring system for campus buildings.', department:'Electrical Engineering', deadline:'2026-11-30', status:'active', team_members:JSON.stringify(['st-002']), progress:0.75, required_equipment:JSON.stringify(['eq-004','eq-005','eq-019']) },
    { id:'proj-004', student_id:'st-003', title:'Robotic Arm Object Sorting', description:'Automated object sorting system using robotic arm and computer vision.', department:'Mechanical Engineering', deadline:'2026-12-10', status:'active', team_members:JSON.stringify(['st-003']), progress:0.30, required_equipment:JSON.stringify(['eq-010','eq-020','eq-012']) },
    { id:'proj-005', student_id:'st-008', title:'Real-Time Sign Language Recognition', description:'Real-time ASL recognition using deep learning and depth cameras.', department:'Computer Science', deadline:'2026-11-28', status:'active', team_members:JSON.stringify(['st-008']), progress:0.85, required_equipment:JSON.stringify(['eq-001','eq-020']) },
    { id:'proj-006', student_id:'st-005', title:'Autonomous Rover Navigation', description:'Ground rover with LiDAR-based SLAM for autonomous navigation.', department:'ECE', deadline:'2026-12-20', status:'active', team_members:JSON.stringify(['st-005']), progress:0.20, required_equipment:JSON.stringify(['eq-003','eq-018','eq-011']) },
    { id:'proj-007', student_id:'st-006', title:'Edge AI Surveillance System', description:'Privacy-preserving AI surveillance using edge computing.', department:'Computer Science', deadline:'2026-12-05', status:'active', team_members:JSON.stringify(['st-006']), progress:0.55, required_equipment:JSON.stringify(['eq-003','eq-020','eq-016']) },
    { id:'proj-008', student_id:'st-009', title:'IoT Air Quality Monitor', description:'Distributed IoT sensor network for campus air quality monitoring.', department:'ECE', deadline:'2026-11-25', status:'active', team_members:JSON.stringify(['st-009']), progress:0.90, required_equipment:JSON.stringify(['eq-004','eq-005','eq-017']) },
  ];
  for (const p of projects) insertProject.run(p);

  // ─── BOOKINGS ───────────────────────────────────────────────────────────────
  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, equipment_id, student_id, project_id, start_time, end_time, status, purpose, priority, created_at, updated_at)
    VALUES (@id, @equipment_id, @student_id, @project_id, @start_time, @end_time, @status, @purpose, @priority, @created_at, @updated_at)
  `);

  const now = new Date().toISOString();
  const bookings = [
    { id:'bk-001', equipment_id:'eq-001', student_id:'st-005', project_id:'proj-006', start_time:'2026-11-23T14:00:00', end_time:'2026-11-23T17:00:00', status:'approved', purpose:'Training autonomous rover navigation model', priority:'high', created_at:now, updated_at:now },
    { id:'bk-002', equipment_id:'eq-001', student_id:'st-008', project_id:'proj-005', start_time:'2026-11-23T10:00:00', end_time:'2026-11-23T13:00:00', status:'completed', purpose:'Sign language model training run', priority:'normal', created_at:now, updated_at:now },
    { id:'bk-003', equipment_id:'eq-008', student_id:'st-003', project_id:'proj-004', start_time:'2026-11-23T09:00:00', end_time:'2026-11-23T12:00:00', status:'approved', purpose:'3D printing gripper parts', priority:'normal', created_at:now, updated_at:now },
    { id:'bk-004', equipment_id:'eq-010', student_id:'st-007', project_id:null, start_time:'2026-11-24T10:00:00', end_time:'2026-11-24T13:00:00', status:'pending', purpose:'Robotics lab coursework demonstration', priority:'normal', created_at:now, updated_at:now },
    { id:'bk-005', equipment_id:'eq-018', student_id:'st-001', project_id:'proj-001', start_time:'2026-11-24T14:00:00', end_time:'2026-11-24T17:00:00', status:'pending', purpose:'LiDAR mapping for drone navigation', priority:'high', created_at:now, updated_at:now },
    { id:'bk-006', equipment_id:'eq-003', student_id:'st-004', project_id:'proj-002', start_time:'2026-11-24T09:00:00', end_time:'2026-11-24T12:00:00', status:'approved', purpose:'Edge inference testing for waste classifier', priority:'normal', created_at:now, updated_at:now },
    { id:'bk-007', equipment_id:'eq-001', student_id:'st-001', project_id:'proj-001', start_time:'2026-11-25T14:00:00', end_time:'2026-11-25T17:00:00', status:'approved', purpose:'Drone vision model fine-tuning', priority:'high', created_at:now, updated_at:now },
    { id:'bk-008', equipment_id:'eq-013', student_id:'st-006', project_id:'proj-007', start_time:'2026-11-23T15:00:00', end_time:'2026-11-23T17:00:00', status:'approved', purpose:'VR interface testing', priority:'normal', created_at:now, updated_at:now },
    { id:'bk-009', equipment_id:'eq-003', student_id:'st-005', project_id:'proj-006', start_time:'2026-11-25T10:00:00', end_time:'2026-11-25T13:00:00', status:'approved', purpose:'Edge SLAM testing on Jetson', priority:'normal', created_at:now, updated_at:now },
    { id:'bk-010', equipment_id:'eq-016', student_id:'st-010', project_id:null, start_time:'2026-11-23T08:00:00', end_time:'2026-11-23T18:00:00', status:'approved', purpose:'Genomics simulation batch job', priority:'critical', created_at:now, updated_at:now },
  ];
  for (const b of bookings) insertBooking.run(b);

  // ─── REQUESTS ───────────────────────────────────────────────────────────────
  const insertRequest = db.prepare(`
    INSERT INTO requests (id, booking_id, faculty_id, status, notes, created_at, updated_at)
    VALUES (@id, @booking_id, @faculty_id, @status, @notes, @created_at, @updated_at)
  `);

  const requests = [
    { id:'req-001', booking_id:'bk-004', faculty_id:'fac-003', status:'pending', notes:'Robotic arm booking requires faculty approval for safety compliance.', created_at:now, updated_at:now },
    { id:'req-002', booking_id:'bk-005', faculty_id:'fac-004', status:'pending', notes:'LiDAR sensor requires research director approval for high-value equipment.', created_at:now, updated_at:now },
  ];
  for (const r of requests) insertRequest.run(r);

  // ─── NOTIFICATIONS for st-001 (Alex) ────────────────────────────────────────
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, user_type, title, message, type, related_id, is_read, created_at)
    VALUES (@id, @user_id, @user_type, @title, @message, @type, @related_id, @is_read, @created_at)
  `);

  const notifications = [
    { id:'notif-001', user_id:'st-001', user_type:'student', title:'Booking Approved', message:'Your booking for NVIDIA RTX 4090 GPU Workstation on Nov 25 has been approved.', type:'booking_approved', related_id:'bk-007', is_read:0, created_at:now },
    { id:'notif-002', user_id:'st-001', user_type:'student', title:'Approval Pending', message:'Your LiDAR booking (bk-005) is awaiting Dr. Torres approval.', type:'request_pending', related_id:'req-002', is_read:0, created_at:now },
    { id:'notif-003', user_id:'st-001', user_type:'student', title:'Equipment Available', message:'NVIDIA RTX 4090 GPU Workstation is now available for booking in CS Lab A.', type:'system', related_id:'eq-001', is_read:1, created_at:now },
    { id:'notif-004', user_id:'st-001', user_type:'student', title:'Deadline Reminder', message:'Project "Autonomous Drone Navigation" deadline is in 22 days. 65% complete.', type:'system', related_id:'proj-001', is_read:0, created_at:now },
    { id:'notif-005', user_id:'st-001', user_type:'student', title:'Booking Conflict Resolved', message:'Alternative slot found for your eq-001 request: Nov 26 10:00-13:00.', type:'alternative_suggested', related_id:'bk-007', is_read:1, created_at:now },
    { id:'notif-006', user_id:'st-001', user_type:'student', title:'New Equipment Added', message:'Velodyne VLP-16 LiDAR is now available in Robotics Lab (requires approval).', type:'system', related_id:'eq-018', is_read:1, created_at:now },
    { id:'notif-007', user_id:'st-001', user_type:'student', title:'Session Ending Soon', message:'Your GPU Workstation session ends in 30 minutes (3:30 PM today).', type:'system', related_id:'bk-001', is_read:0, created_at:now },
    { id:'notif-008', user_id:'st-001', user_type:'student', title:'Booking Completed', message:'Your booking for Intel RealSense D455 Camera has been marked as completed.', type:'system', related_id:'eq-020', is_read:1, created_at:now },
    { id:'notif-009', user_id:'fac-004', user_type:'faculty', title:'Approval Required', message:'Alex Morgan is requesting LiDAR sensor (eq-018) for drone navigation project.', type:'request_pending', related_id:'req-002', is_read:0, created_at:now },
    { id:'notif-010', user_id:'fac-003', user_type:'faculty', title:'Approval Required', message:'James Wilson is requesting UR5e Robotic Arm (eq-010) for coursework demonstration.', type:'request_pending', related_id:'req-001', is_read:0, created_at:now },
  ];
  for (const n of notifications) insertNotification.run(n);

  console.log('✅ Database seeded successfully.');
  console.log(`   ${equipmentData.length} equipment | ${students.length} students | ${faculty.length} faculty`);
  console.log(`   ${projects.length} projects | ${bookings.length} bookings | ${requests.length} requests | ${notifications.length} notifications`);
}

// Run when called directly
if (require.main === module) {
  seedDatabase();
}
