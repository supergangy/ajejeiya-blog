---
title: "파이썬 프로그램을 exe 파일 하나로 만들기 (PyInstaller, 구글 라이브러리 포함)"
description: "tkinter로 만든 파이썬 프로그램을 PyInstaller로 exe 하나로 묶은 과정입니다. 구글 Cloud Vision 같은 라이브러리를 넣을 때 필요한 옵션과 실제로 막혔던 점을 정리했습니다."
pubDate: 2026-10-03
category: "개발 팁"
tags: ["파이썬", "PyInstaller", "exe 만들기", "tkinter", "구글 Cloud Vision"]
cover: "/images/pyinstaller-exe/cover.png"
draft: true
---

스캔 PDF를 검색되는 PDF로 바꿔 주는 [PDF OCR 프로그램](/blog/pdf-ocr-program/)을 파이썬으로 만들었습니다. 제 컴퓨터에서는 잘 돌아갔는데, 문제는 **파이썬이 없는 컴퓨터**였어요. 다른 사람에게 "파이썬 설치하고, pip로 라이브러리 깔고, 명령어로 실행하세요"라고 할 수는 없으니까요.

그래서 PyInstaller로 **더블클릭 한 번이면 실행되는 exe 파일 하나**를 만들었습니다. 기본 사용법은 간단한데, 구글 라이브러리가 들어가면 옵션을 몇 개 더 챙겨야 하고, 생각지도 못한 곳에서 막히기도 했습니다. 그 과정을 그대로 정리합니다.

## 제가 만든 환경

| 항목 | 내용 |
|---|---|
| 프로그램 종류 | tkinter 창 프로그램 (PDF OCR) |
| 주요 라이브러리 | google-cloud-vision (grpc 포함), PyMuPDF, Pillow |
| 운영체제 | Windows 11 |
| 파이썬 | 3.14 |
| PyInstaller | 6.22.3 |

[PyInstaller](https://pyinstaller.org/)는 파이썬 실행기와 내 코드, 쓰는 라이브러리를 한데 묶어 exe로 만들어 주는 도구입니다. 받는 사람은 파이썬을 몰라도 exe만 실행하면 됩니다. 옵션은 버전에 따라 바뀔 수 있으니 자세한 내용은 공식 문서를 함께 보세요.

## 1단계: PyInstaller 설치

명령 프롬프트(cmd)에서 아래 한 줄이면 됩니다.

```bat
python -m pip install pyinstaller
```

`pyinstaller` 명령 대신 `python -m PyInstaller`처럼 쓰면, 파이썬이 여러 개 깔려 있어도 **지금 쓰는 파이썬에 설치된 PyInstaller**로 실행돼서 헷갈릴 일이 줄어듭니다.

## 2단계: 실제로 쓴 빌드 명령

cmd에서 `ocr_app.py`가 있는 폴더로 이동한 뒤 아래 명령을 실행합니다. 제가 실제로 쓴 명령이에요. 줄 끝의 `^`는 cmd에서 "다음 줄로 이어진다"는 뜻입니다.

```bat
python -m PyInstaller --noconfirm --onefile --windowed --name PDF_OCR ^
  --collect-data grpc --collect-submodules google.cloud.vision ^
  --copy-metadata google-cloud-vision --copy-metadata google-api-core --copy-metadata grpcio ^
  ocr_app.py
```

옵션이 많아 보이지만 하나씩 보면 어렵지 않습니다.

| 옵션 | 하는 일 |
|---|---|
| `--noconfirm` | 이전 빌드 결과가 있어도 묻지 않고 덮어씀 |
| `--onefile` | 결과물을 **exe 파일 하나**로 만듦 |
| `--windowed` | 실행할 때 검은 콘솔 창이 뜨지 않음 (창 프로그램용) |
| `--name PDF_OCR` | 만들어질 exe 이름 |
| `--collect-data grpc` | grpc가 쓰는 인증서 같은 **데이터 파일**까지 포함 |
| `--collect-submodules google.cloud.vision` | 코드 실행 중에 **동적으로 불러오는 하위 모듈**까지 포함 |
| `--copy-metadata ...` | 실행 중에 자기 **패키지 버전 정보**를 읽는 라이브러리를 위해 메타데이터 포함 |

### 구글 라이브러리에 옵션이 더 필요한 이유

PyInstaller는 코드의 `import` 문을 따라가며 필요한 파일을 찾습니다. 그런데 구글 라이브러리는 이 방식으로 다 찾기 어려운 부분이 있어요.

- **grpc**는 통신에 쓰는 인증서 파일 같은 데이터가 필요한데, 이건 파이썬 코드가 아니라서 `import`로는 안 따라옵니다. 그래서 `--collect-data`로 직접 넣어 줍니다.
- **google.cloud.vision**은 내부 모듈을 실행 중에 불러오는 부분이 있어서 `--collect-submodules`로 하위 모듈을 통째로 챙깁니다.
- 일부 라이브러리는 실행할 때 "내 버전이 뭐지?" 하고 설치 정보(메타데이터)를 읽습니다. exe 안에 이 정보가 없으면 문제가 될 수 있어서 `--copy-metadata`로 넣어 줍니다.

빌드가 끝나면 `dist` 폴더에 `PDF_OCR.exe`가 생깁니다. 제 경우 크기는 **약 53MB**였어요. 파이썬 실행기와 구글 라이브러리가 통째로 들어가니 생각보다 큽니다.

## 3단계: 제대로 만들어졌는지 확인하기

여기서 한 가지 함정이 있습니다. `--windowed`로 만든 exe는 **오류가 나도 아무 창이 안 뜰 수 있어서** 왜 안 되는지 알 수가 없어요.

그래서 저는 이렇게 확인했습니다.

1. 같은 옵션에서 `--windowed`만 빼고 **콘솔 모드 시험용 exe**를 따로 만듭니다.
2. 시험용 exe를 실행해서 구글 연결과 실제 OCR까지 돌려 봅니다. 문제가 있으면 콘솔 창에 오류 내용이 그대로 보입니다.
3. 정상인 걸 확인한 뒤, 배포용 `--windowed` exe를 실행해서 **창 제목(버전 포함)이 제대로 뜨는지** 확인합니다.

> 콘솔 모드 exe로 먼저 시험하고, 문제가 없으면 창 모드 exe를 배포하세요. 이 순서만 지켜도 "실행했는데 아무 반응이 없다"는 상황에서 헤매는 시간을 많이 줄일 수 있습니다.

## 막혔던 점: 한글 주석 하나 때문에 bat 파일이 실패

매번 긴 명령을 치기 번거로워서 `build.bat` 파일에 명령을 넣어 두었습니다. 친절하게 `rem`으로 한글 주석도 달았고요. 그런데 실행하니 이런 엉뚱한 오류가 나왔습니다.

```text
'build.bat' is not recognized as an internal or external command
```

분명히 그 파일을 실행했는데 "그런 명령이 없다"니 처음엔 당황했어요. 원인은 **한글 주석**으로 보였습니다. 파일은 UTF-8로 저장했는데, cmd는 다른 코드페이지(한국어 Windows는 보통 CP949)로 읽기 때문에 한글 부분이 깨지면서 명령줄이 엉뚱하게 해석된 것으로 보입니다.

주석을 영어로 바꾸니 바로 해결됐습니다.

```bat
@echo off
rem Build single-file exe (no console window)
python -m PyInstaller --noconfirm --onefile --windowed --name PDF_OCR ^
  --collect-data grpc --collect-submodules google.cloud.vision ^
  --copy-metadata google-cloud-vision --copy-metadata google-api-core --copy-metadata grpcio ^
  ocr_app.py
```

참고로 bat 파일 맨 위에 `chcp 65001`을 넣어 cmd가 UTF-8로 읽게 하는 방법도 있다고 알려져 있습니다. 다만 저는 **bat 파일에는 한글을 안 쓰는 쪽**이 가장 간단하다고 느꼈어요.

## 배포할 때 알아 둘 점

exe를 만들었다고 끝이 아니었습니다. 직접 겪은 것과 일반적으로 알려진 주의점을 함께 정리했습니다.

| 상황 | 내용과 대처 |
|---|---|
| "PC 보호" 경고 | 서명되지 않은 exe는 처음 실행할 때 Windows SmartScreen 경고가 뜹니다. <strong>[추가 정보] → [실행]</strong>을 누르면 됩니다. |
| 백신 오진 | PyInstaller로 만든 exe를 백신이 잘못 진단하는 경우가 있습니다. 저는 소스 코드를 GitHub에 공개해서 누구나 확인할 수 있게 했습니다. |
| 처음 실행이 느림 | `--onefile` exe는 실행할 때마다 임시 폴더에 내용을 풀기 때문에 창이 뜨기까지 몇 초 걸릴 수 있습니다. |
| 코드 수정 | 코드를 고치면 exe를 **다시 빌드**해야 합니다. |
| 저장소 정리 | 빌드할 때 생기는 `.spec` 파일과 `build` 폴더는 저장소에 올리지 않았습니다. |

배포는 GitHub Releases를 썼습니다. [GitHub CLI(gh)](https://cli.github.com/)를 설치하고 로그인(`gh auth login`)해 두면, 저장소 폴더에서 한 줄로 올릴 수 있어요.

```bat
gh release create v1.0.0 dist/PDF_OCR.exe
```

### 라이선스도 같이 배포된다는 점

의외로 놓치기 쉬운 부분입니다. exe 안에 라이브러리를 넣으면 **그 라이브러리도 함께 배포하는 것**이 됩니다. 저는 PDF 처리에 PyMuPDF를 썼는데, PyMuPDF는 AGPL 라이선스(따로 상용 라이선스를 사지 않는 경우)라서 소스 공개 의무가 생깁니다. 그래서 GitHub에 소스 코드와 LICENSE 파일, 사용한 오픈소스 목록(THIRD_PARTY_NOTICES)을 함께 올렸습니다.

라이브러리마다 라이선스 조건이 다르고 바뀔 수도 있으니(이 글은 2026년 10월 기준), exe로 배포하기 전에 쓰고 있는 라이브러리의 라이선스를 각 공식 저장소나 사이트에서 한 번씩 확인해 보세요.

## 꼭 exe가 필요할까?

솔직히 말하면 exe가 늘 정답은 아닙니다. **파이썬이 설치된 내 PC에서만 쓸 거라면** 굳이 53MB짜리 exe를 만들 필요가 없어요. `pythonw.exe`로 .py 파일을 실행하는 .bat 바로가기 정도면 검은 창 없이 충분히 편하게 쓸 수 있습니다.

```bat
@echo off
start "" pythonw ocr_app.py
```

exe는 **파이썬이 없는 다른 사람에게 나눠 줄 때** 가치가 있습니다.

## 정리: exe 만들기 체크리스트

- [ ] `python -m pip install pyinstaller`로 설치했다
- [ ] `--onefile`, 창 프로그램이면 `--windowed`를 넣었다
- [ ] 구글 라이브러리를 쓰면 `--collect-data grpc`, `--collect-submodules`, `--copy-metadata`를 챙겼다
- [ ] 콘솔 모드 시험용 exe로 실제 기능까지 돌려 봤다
- [ ] bat 파일에 한글 주석을 넣지 않았다 (또는 인코딩 문제를 해결했다)
- [ ] "PC 보호" 경고와 백신 오진 가능성을 사용자에게 안내했다
- [ ] exe에 넣은 라이브러리의 라이선스를 확인했다
- [ ] `.spec` 파일과 `build` 폴더는 저장소에서 뺐다

이렇게 만든 exe가 실제로 어떻게 쓰이는지는 [PDF OCR 프로그램 소개 글](/blog/pdf-ocr-program/)에서 볼 수 있습니다. 구글 클라우드 인증 때문에 막혔다면 [서비스 계정 키가 막힐 때 API 키를 쓰는 방법](/blog/gcp-api-key-instead-of-service-account-key/)도 참고해 보세요.
