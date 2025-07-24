# Webpage Data Loader Setup

## Local Python Environment Setup

1. **Create and activate the virtual environment (if not already done):**
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

3. **Generate the data file:**
   ```sh
   python generate_data_json.py
   ```
   This will create or update `data.json` in your project directory.

4. **Run your web server as usual.**
   The web app will now load data from `data.json` and will not make API calls on each page load.

---

## Updating Data
Whenever you want to refresh the data from Google Sheets, simply re-run:
```sh
python generate_data_json.py
```

---

## Notes
- The `.venv` folder contains your isolated Python environment.
- All required Python packages are listed in `requirements.txt`.
- The only required package for data generation is `requests`. 