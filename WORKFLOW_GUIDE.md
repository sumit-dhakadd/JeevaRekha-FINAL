# 🌿 Sequential Herb Workflow Guide

This guide explains the enhanced sequential workflow where farmers add herbs, and each participant fills their details in order, with the manager generating a final QR code containing all details.

## 🔄 Workflow Overview

The system now enforces a sequential workflow where each participant must complete their task before the next participant can proceed:

```
Farmer → Lab Technician → Processor → Manager → QR Generation
```

## 📋 Workflow Steps

### 1. 🌱 Farmer Adds Herb
- **What happens**: Farmer harvests herbs and adds them to the system
- **Status**: `workflowStatus.farmer.completed = true`
- **Next**: Herb appears in Lab Technician's pending work

**API Endpoint**: `POST /api/harvest`
- Creates harvest record
- Creates/updates herb with farmer details
- Sets workflow status for farmer as completed

### 2. 🧪 Lab Technician Testing
- **What happens**: Lab technician sees pending herbs and performs quality testing
- **Status**: `workflowStatus.labTechnician.completed = true`
- **Next**: Herb appears in Processor's pending work

**API Endpoint**: `POST /api/test-result`
- Adds test results to herb
- Updates workflow status for lab technician
- Herb becomes available for processing

### 3. ⚙️ Processor Processing
- **What happens**: Processor sees tested herbs and creates processing batches
- **Status**: `workflowStatus.processor.completed = true`
- **Next**: Herb appears in Manager's pending work

**API Endpoint**: `POST /api/processing-batch`
- Creates processing batch
- Updates workflow status for processor
- Herb becomes available for final approval

### 4. 👨‍💼 Manager Final Approval
- **What happens**: Manager sees processed herbs and completes the workflow
- **Status**: `workflowStatus.manager.completed = true`
- **Result**: Final QR code generated with all details

**API Endpoint**: `POST /api/manager/complete-herb/:herbId`
- Validates all previous steps are completed
- Generates comprehensive QR code data
- Marks workflow as complete

## 🔍 Pending Work Tracking

Each participant sees only the herbs that are ready for their action:

### Lab Technician Dashboard
- **Shows**: Herbs where `farmer.completed = true` and `labTechnician.completed = false`
- **Endpoint**: `GET /api/lab/pending-herbs`

### Processor Dashboard
- **Shows**: Herbs where `farmer.completed = true`, `labTechnician.completed = true`, and `processor.completed = false`
- **Endpoint**: `GET /api/processor/pending-herbs`

### Manager Dashboard
- **Shows**: Herbs where all previous steps are completed and `manager.completed = false`
- **Endpoint**: `GET /api/manager/pending-herbs`

## 📱 QR Code Generation

When the manager completes the workflow, a comprehensive QR code is generated containing:

```json
{
  "herbId": "herb_id",
  "species": "Herb Name",
  "variety": "Variety",
  "batchId": "BATCH-123",
  "harvestDate": "2024-01-01",
  "origin": {
    "address": "Farm Location",
    "coordinates": [lat, lng]
  },
  "farmer": {
    "name": "Farmer Name",
    "email": "farmer@email.com",
    "phone": "+1234567890"
  },
  "workflow": {
    "farmer": {
      "completed": true,
      "completedAt": "2024-01-01T10:00:00Z",
      "details": "Harvested 10kg of Test Herb"
    },
    "labTechnician": {
      "completed": true,
      "completedAt": "2024-01-01T12:00:00Z",
      "details": "Quality testing completed - Grade: A"
    },
    "processor": {
      "completed": true,
      "completedAt": "2024-01-01T14:00:00Z",
      "details": "Processing batch created - Type: drying"
    },
    "manager": {
      "completed": true,
      "completedAt": "2024-01-01T16:00:00Z",
      "details": "Final approval and certification completed"
    }
  },
  "testResults": [...],
  "processingBatches": [...],
  "certificateInfo": {
    "issuedBy": "Manager Name",
    "issueDate": "2024-01-01T16:00:00Z",
    "validUntil": "2025-01-01T16:00:00Z"
  },
  "finalQRGenerated": "2024-01-01T16:00:00Z"
}
```

## 🔍 QR Code Scanning

When consumers scan the QR code, they see:

1. **Complete Supply Chain Journey**: All steps from harvest to final approval
2. **Participant Details**: Who completed each step and when
3. **Quality Information**: Test results and processing details
4. **Certification**: Final approval and certificate information
5. **Traceability**: Complete audit trail of the herb's journey

## 🚀 Testing the Workflow

Run the test script to see the complete workflow in action:

```bash
node test-workflow.js
```

This will:
1. Create a test herb
2. Simulate each participant completing their task
3. Generate the final QR code
4. Display the complete workflow status

## 🎯 Key Features

### Sequential Enforcement
- Participants can only work on herbs that are ready for their step
- Previous steps must be completed before proceeding
- Clear workflow status tracking

### Comprehensive Tracking
- Each participant's completion is tracked with timestamps
- Detailed information about what each participant did
- Complete audit trail for compliance

### Real-time Updates
- WebSocket updates notify all participants of workflow changes
- Dashboards automatically refresh with new pending work
- Live status updates across all interfaces

### Enhanced QR Codes
- QR codes contain all participant details
- Complete supply chain information
- Consumer transparency and trust

## 🔧 API Endpoints

### Workflow Management
- `GET /api/lab/pending-herbs` - Get herbs ready for lab testing
- `GET /api/processor/pending-herbs` - Get herbs ready for processing
- `GET /api/manager/pending-herbs` - Get herbs ready for final approval
- `POST /api/manager/complete-herb/:herbId` - Complete workflow and generate QR

### QR Code Scanning
- `GET /api/herbs/qr/:qrCode` - Get comprehensive herb details from QR code

## 📊 Dashboard Updates

All dashboards now show:
- **Workflow Status**: Visual indicators of completion status
- **Pending Work**: Only items ready for the current participant
- **Progress Tracking**: Clear indication of workflow progress
- **Action Buttons**: Context-appropriate actions for each participant

## 🎉 Benefits

1. **Clear Workflow**: Sequential process ensures nothing is missed
2. **Accountability**: Each participant's contribution is tracked
3. **Transparency**: Complete visibility into the supply chain
4. **Quality Assurance**: Enforced testing and processing steps
5. **Consumer Trust**: Comprehensive QR codes build confidence
6. **Compliance**: Complete audit trail for regulatory requirements

The enhanced workflow ensures that herbs go through a complete, traceable journey from farm to consumer, with each participant contributing their expertise and the final QR code containing all the details for complete transparency.

