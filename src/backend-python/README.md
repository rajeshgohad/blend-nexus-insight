 # Python FastAPI Backend for AI Agents
 
 This folder contains the Python/FastAPI implementation of the PharmaMES AI agents.
 
 ## Structure
 
 ```
 backend-python/
 ├── main.py                 # FastAPI server with all endpoints
 ├── requirements.txt        # Python dependencies
 ├── agents/
 │   ├── __init__.py
 │   ├── maintenance_agent.py
 │   ├── yield_optimization_agent.py
 │   ├── vision_agent.py
 │   └── scheduling_agent.py
 └── models/
     ├── __init__.py
     ├── maintenance.py
     ├── yield_optimization.py
     ├── vision.py
     └── scheduling.py
 ```
 
 ## Setup
 
 ```bash
 cd src/backend-python
 
 # Create virtual environment
 python -m venv venv
 source venv/bin/activate  # On Windows: venv\Scripts\activate
 
 # Install dependencies
 pip install -r requirements.txt
 
 # Run the server
 uvicorn main:app --reload --port 3001
 ```
 
 ## API Endpoints
 
 ### Health Check
 - `GET /health` - Service health check
 
 ### Maintenance Agent
 - `POST /api/maintenance/analyze-component` - Analyze component for maintenance
 - `POST /api/maintenance/predict-rul` - Predict Remaining Useful Life
 - `POST /api/maintenance/detect-anomalies` - Detect sensor anomalies
 - `POST /api/maintenance/find-idle-window` - Find maintenance window
 
 ### Yield Optimization Agent
 - `POST /api/yield/detect-drift` - Detect parameter drift
 - `POST /api/yield/predict` - Predict yield
 - `POST /api/yield/recommendations` - Generate recommendations
 - `POST /api/yield/validate-recommendation` - Validate recommendation
 - `GET /api/yield/sop-limits` - Get SOP limits
 
 ### Vision QC Agent
 - `POST /api/vision/analyze-detection` - Analyze detection
 - `POST /api/vision/detect-baseline-deviation` - Detect baseline deviation
 - `POST /api/vision/route-alert` - Route alert
 - `POST /api/vision/analyze-metrics` - Analyze vision metrics
 
 ### Scheduling Agent
 - `POST /api/scheduling/group-batches` - Group batches
 - `POST /api/scheduling/optimize` - Optimize schedule
 - `POST /api/scheduling/validate` - Validate schedule
 
 ## Authentication
 
 All endpoints (except `/health`) require authentication via:
 - Header: `X-API-Key: your-api-key`
 - Or: `Authorization: Bearer your-api-key`
 
 Set the API key via environment variable:
 ```bash
 export AI_AGENTS_API_KEY="your-production-api-key"
 ```
 
 ## Interactive API Documentation
 
 Once running, access the auto-generated docs at:
 - Swagger UI: http://localhost:3001/docs
 - ReDoc: http://localhost:3001/redoc
 
 ## Docker Deployment
 
 ```dockerfile
 FROM python:3.11-slim
 
 WORKDIR /app
 COPY requirements.txt .
 RUN pip install --no-cache-dir -r requirements.txt
 
 COPY . .
 
 EXPOSE 3001
 CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]
 ```
 
 ```bash
 docker build -t pharmames-agents .
 docker run -p 3001:3001 -e AI_AGENTS_API_KEY=your-key pharmames-agents
 ```