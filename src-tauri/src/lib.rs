use std::fs;
use std::path::Path;
use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified_ms: u64,
}

/// 极速读取文件内容
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("无法读取文件 '{}': {}", path, e))
}

/// 原子安全写入文件（先写入 .tmp 再原子覆盖，防断电丢失）
#[tauri::command]
fn write_file_atomic(path: String, content: String) -> Result<(), String> {
    let target_path = Path::new(&path);
    let tmp_path = format!("{}.wrmd.tmp", path);

    // 1. 写入临时文件
    if let Err(e) = fs::write(&tmp_path, content.as_bytes()) {
        return Err(format!("写入临时文件失败: {}", e));
    }

    // 2. 原子重命名覆盖原文件
    if let Err(e) = fs::rename(&tmp_path, target_path) {
        // 如果跨卷重命名或受限，尝试标准复制与删除
        if let Err(copy_err) = fs::copy(&tmp_path, target_path) {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!("覆盖原文件失败: {} / {}", e, copy_err));
        }
        let _ = fs::remove_file(&tmp_path);
    }

    Ok(())
}

/// 获取通过双击或命令行传入的目标打开文件路径
#[tauri::command]
fn get_cli_target_file() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    // 过滤掉当前可执行程序路径自身
    for arg in args.into_iter().skip(1) {
        if !arg.starts_with("--") {
            let p = Path::new(&arg);
            if p.exists() && p.is_file() {
                return Some(arg);
            }
        }
    }
    None
}

/// 获取文件元数据
#[tauri::command]
fn get_file_info(path: String) -> Result<FileInfo, String> {
    let p = Path::new(&path);
    let meta = fs::metadata(p).map_err(|e| e.to_string())?;
    let name = p.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Untitled.md".to_string());
    
    let modified_ms = meta.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    Ok(FileInfo {
        name,
        path,
        size: meta.len(),
        modified_ms,
    })
}

/// 记录"上次打开文件"的配置文件路径（位于应用配置目录）
fn last_file_store(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("last_file.txt"))
}

/// 读取上次打开的文件；文件已被删除/移动则返回 None
#[tauri::command]
fn get_last_file(app: tauri::AppHandle) -> Option<String> {
    let p = last_file_store(&app).ok()?;
    let s = fs::read_to_string(p).ok()?;
    let s = s.trim().to_string();
    if !s.is_empty() && Path::new(&s).is_file() {
        Some(s)
    } else {
        None
    }
}

/// 记录当前打开的文件
#[tauri::command]
fn set_last_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let p = last_file_store(&app)?;
    fs::write(p, path).map_err(|e| e.to_string())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            write_file_atomic,
            get_cli_target_file,
            get_file_info,
            get_last_file,
            set_last_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
