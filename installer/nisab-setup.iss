; Inno Setup Script for Nisab (نصاب)
; Minimum Windows Version: Windows 7 (6.1)

#define MyAppName "نصاب (Nisab)"
#define MyAppVersion "1.0"
#define MyAppPublisher "Mahmoud-Ibrahim"
#define MyAppURL "https://github.com/Mahmoud-ibrahim74/Nisab"
#define MyAppExeName "Nisab.exe"
#define MyAppDescription "نصاب - تطبيق إسلامي شامل للقرآن الكريم، الأذكار، مواقيت الصلاة، متابعة الختمة، وحساب الزكاة"

[Setup]
AppId={{9F82CD7E-28A3-4C2E-B763-7B1F341991EA}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Nisab
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist-bin\make\installer
OutputBaseFilename=Nisab-1.0-Setup
SetupIconFile=..\src\assets\icon.ico
WizardSmallImageFile=..\src\assets\wizard-small.bmp
WizardImageFile=..\src\assets\wizard-large.bmp
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
MinVersion=6.1
VersionInfoVersion={#MyAppVersion}.0.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppDescription}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName} {#MyAppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
CreateDesktopIcon=إنشاء اختصار على سطح المكتب (Create Desktop Shortcut)
AdditionalIcons=أيقونات إضافية (Additional Shortcuts):
LaunchProgram=تشغيل برنامج نصاب الآن (Launch Nisab)

[Messages]
SetupAppTitle=معالج تثبيت نصاب (Nisab Setup)
SetupWindowTitle=تثبيت برنامج نصاب - الإصدار {#MyAppVersion}
WelcomeLabel1=مرحباً بك في معالج تثبيت برنامج نصاب (Nisab)
WelcomeLabel2=سيقوم المعالج بتثبيت برنامج نصاب على جهاز الكمبيوتر الخاص بك.%n%nنصاب هو تطبيق إسلامي شامل يضم: القرآن الكريم، الأذكار، مواقيت الصلاة، متابعة الختمة، وحساب الزكاة.%n%nالحد الأدنى للنظام: Windows 7 أو أحدث.%n%nاضغط على "Next" للمتابعة.
SelectDirLabel3=سيتم تثبيت برنامج نصاب في المسار التالي:
SelectDirBrowseLabel=للمتابعة اضغط على "Next". لتغيير المسار اضغط على "Browse".
ReadyLabel1=أصبح المعالج جاهزاً لتثبيت برنامج نصاب على جهازك.
InstallingLabel=جاري تثبيت ملفات برنامج نصاب، يرجى الانتظار...
FinishedHeadingLabel=اكتمل تثبيت برنامج نصاب بنجاح!
FinishedLabel=تم تثبيت تطبيق نصاب (الإصدار {#MyAppVersion}) بنجاح على جهازك.%n%nاضغط على "Finish" للخروج من المعالج.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\dist-bin\Nisab-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram}"; Flags: nowait postinstall skipifsilent
