import os
import subprocess
import re
import sys

# Ensure stdout uses utf-8 on Windows
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def parse_env_file(filepath):
    env_vars = {}
    if not os.path.exists(filepath):
        print(f"Error: .env file not found at {filepath}")
        return env_vars
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                env_vars[k] = v
    return env_vars

def parse_apphosting_yaml(filepath):
    # Simple custom parser for apphosting.yaml to avoid yaml dependency issues
    secrets = []
    if not os.path.exists(filepath):
        print(f"Error: apphosting.yaml not found at {filepath}")
        return secrets
        
    current_var = None
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            # Look for variable lines
            var_match = re.search(r'-\s+variable:\s+(\w+)', line)
            if var_match:
                current_var = var_match.group(1)
                continue
            
            # Look for secret lines
            secret_match = re.search(r'secret:\s+(\w+)', line)
            if secret_match and current_var:
                secrets.append({
                    'variable': current_var,
                    'secret': secret_match.group(1)
                })
                current_var = None
    return secrets

def run_command(cmd, input_data=None):
    try:
        result = subprocess.run(
            cmd,
            input=input_data,
            text=True,
            capture_output=True,
            check=False
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    env_path = '.env'
    yaml_path = 'apphosting.yaml'
    project_id = 'nimex-ecommerce'
    backend_id = 'nimex-1'
    location = 'us-east4'
    
    print(f"Reading environment variables from {env_path}...")
    env_vars = parse_env_file(env_path)
    
    print(f"Parsing secrets configuration from {yaml_path}...")
    secret_mappings = parse_apphosting_yaml(yaml_path)
    
    if not secret_mappings:
        print("No secrets found in apphosting.yaml.")
        return
        
    print(f"Found {len(secret_mappings)} secret mappings.")
    
    for mapping in secret_mappings:
        var_name = mapping['variable']
        secret_name = mapping['secret']
        
        print("\n" + "="*50)
        print(f"Processing Secret: {secret_name} (mapped from env var: {var_name})")
        
        if var_name not in env_vars:
            print(f"[WARNING] {var_name} is not present in the .env file.")
            print(f"Skipping setting {secret_name} (you will need to configure this manually).")
            continue
            
        secret_value = env_vars[var_name]
        
        # Check if it looks like a placeholder
        is_placeholder = any(placeholder in secret_value.lower() for placeholder in ["your_", "placeholder", "xxx", "replace_me"])
        if is_placeholder:
            print(f"[NOTE] Value for {var_name} looks like a placeholder: '{secret_value}'")
            
        print(f"Setting secret {secret_name} in Firebase...")
        
        # Call firebase apphosting:secrets:set
        set_cmd = ["cmd.exe", "/c", "npx", "firebase", "apphosting:secrets:set", secret_name, "--project", project_id, "--data-file", "-"]
        success, stdout, stderr = run_command(set_cmd, input_data=secret_value)
        
        if success:
            print(f"[OK] Successfully set secret {secret_name}.")
        else:
            print(f"[ERROR] Failed to set secret {secret_name}.")
            print(f"Error details: {stderr or stdout}")
            continue
            
        print(f"Granting access to secret {secret_name} for backend {backend_id}...")
        
        # Call firebase apphosting:secrets:grantaccess
        grant_cmd = ["cmd.exe", "/c", "npx", "firebase", "apphosting:secrets:grantaccess", secret_name, "--backend", backend_id, "--location", location, "--project", project_id]
        success, stdout, stderr = run_command(grant_cmd)
        
        if success:
            print(f"[OK] Successfully granted access to secret {secret_name}.")
        else:
            print(f"[ERROR] Failed to grant access to secret {secret_name}.")
            print(f"Error details: {stderr or stdout}")

if __name__ == '__main__':
    main()
