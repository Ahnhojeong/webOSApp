# 도움말 메시지 함수
function Show-Usage {
  Write-Host ">> Usage: .\deploy.ps1 {DEVICE_NAME} {APP_ID} {APP_VERSION} {VENDOR_NAME} {APP_TITLE}"
  Write-Host ">> Example: .\deploy.ps1 stanbyme com.hojeong.app 1.0.0 'hojeong' 'hojeong test app'"
  exit 1
}

# 매개변수 유효성 검사
if ($args.Count -ne 5) {
  Write-Host ">> Error: Incorrect number of arguments."
  Show-Usage
}

# 매개변수 할당
$DEVICE_NAME = $args[0]
$APP_ID = $args[1]
$APP_VERSION = $args[2]
$VENDOR_NAME = $args[3]
$APP_TITLE = $args[4]

# $SIMULATOR_PATH = "C:\Users\user\tool\webOS_TV_22_Simulator_1.4.1"
$SIMULATOR_PATH = "C:\Users\user\tool\webOS_TV_6.0_Simulator_1.4.1"
$BUILD_PATH = "C:\Users\user\Documents\creatz\webos-app\build"

# 매개변수 출력
Write-Host ">> Device name: $DEVICE_NAME"
Write-Host ">> App ID: $APP_ID"
Write-Host ">> App version: $APP_VERSION"
Write-Host ">> Vendor: $VENDOR_NAME"
Write-Host ">> App title: $APP_TITLE"

# 프로젝트 빌드
Write-Host ">> Building the project..."
npm run build:dev

# Build directory로 변경
Set-Location -Path .\build
Write-Host ">> Changed to build directory."

# appinfo.json 파일 생성
Write-Host ">> Creating appinfo.json..."
$appInfo = @"
{
    "id": "$APP_ID",
    "version": "$APP_VERSION",
    "vendor": "$VENDOR_NAME",
    "type": "web",
    "main": "index.html",
    "title": "$APP_TITLE",
    "icon": "icon.png",
    "allowVideoCapture": true,
    "requiredPermissions": [ "time.query", "activity.operation", "databse.operation", "com.heartbeat.app.service.group" ],
    "supportTouchMode": "full"
}
"@
$appInfo | Out-File -FilePath .\appinfo.json -Encoding UTF8

# appinfo.json 파일 내용 확인
Write-Host ">> Displaying contents of appinfo.json:"
Get-Content .\appinfo.json

# 아이콘 파일 복사
Write-Host ">> Copying icon file..."
Copy-Item ..\icon.png .\icon.png

# 애플리케이션 패키징
Write-Host ">> Packaging the application..."
if (ares-package . -o ..\IPK) {
  Write-Host ">> Package created successfully."
}
else {
  Write-Host ">> Error creating package."
  exit 1
}

# IPK directory로 변경
Set-Location -Path ..\IPK
Write-Host ">> Changed to IPK directory."

# 기존 앱 삭제
Write-Host ">> Removing existing installation of the app."
if (ares-install -d $DEVICE_NAME -r $APP_ID) {
  Write-Host ">> Existing app removed successfully."
}
else {
  Write-Host ">> Error occurred while trying to remove existing app. The app may not be installed."
}

# 새 패키지 설치
Write-Host ">> Installing new package..."
if (ares-install -d $DEVICE_NAME "${APP_ID}_${APP_VERSION}_all.ipk") {
  Write-Host ">> Package installed successfully."
}
else {
  Write-Host ">> Error installing package. No matched device found: $DEVICE_NAME"
  exit 1
}

# 앱 실행
Write-Host ">> Launching the app..."
if (ares-launch -s '6.0' -sp $SIMULATOR_PATH $BUILD_PATH) {
  Write-Host ">> App launched successfully."
}
else {
  Write-Host ">> Error launching app. The app may not be installed. Please check the list by running 'ares-install -l'."
  exit 1
}

# 디렉토리 변경
Set-Location ..

# # Build directory 제거
# Write-Host ">> Removing existing build directory..."
# Remove-Item -Path .\build -Recurse -Force

# # IPK directory 제거
# Write-Host ">> Removing existing IPK directory..."
# Remove-Item -Path .\IPK -Recurse -Force

# # 인스펙터 열기
# Write-Host ">> Returning to initial directory & Opening inspector..."
# $inspectResult = ares-inspect -d $DEVICE_NAME --app $APP_ID 2>&1
# if ($LASTEXITCODE -eq 0) {
#     Write-Host ">> Inspector opened successfully."
# } else {
#     if ($inspectResult -match "No matched device") {
#         Write-Host ">> Error opening inspector. No matched device found: $DEVICE_NAME"
#     } elseif ($inspectResult -match "Cannot find proper launchPoint") {
#         Write-Host ">> Error opening inspector. The app may not be installed or cannot find proper launchPoint. Please check the list by running 'ares-install -l'."
#     } else {
#         Write-Host ">> Error opening inspector: $inspectResult"
#     }
#     exit 1
# }