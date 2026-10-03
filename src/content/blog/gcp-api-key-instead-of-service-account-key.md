---
title: "GCP 서비스 계정 키 생성 막힘: Cloud Vision은 API 키로 해결"
description: "서비스 계정 키 생성이 iam.disableServiceAccountKeyCreation 정책으로 막혀도 Cloud Vision API는 API 키로 쓸 수 있습니다. 콘솔·Cloud Shell로 키 만들기, 파이썬 코드, 보안 수칙을 정리했습니다."
pubDate: 2026-10-03
category: "구글 클라우드"
tags: ["구글 클라우드", "Cloud Vision", "API 키", "서비스 계정", "조직 정책"]
cover: "/images/gcp-api-key-instead-of-service-account-key/cover.png"
draft: false
---

서비스 계정 json 키 생성이 `iam.disableServiceAccountKeyCreation` 조직 정책으로 막혔다면, 이미지를 보내 OCR만 하는 경우 Cloud Vision API는 API 키로 바로 쓸 수 있습니다. API 키는 이 정책의 영향을 받지 않습니다.

스캔한 PDF를 검색되는 PDF로 바꾸는 [OCR 프로그램](/blog/pdf-ocr-program/)을 만들면서, 처음에는 인터넷 강좌를 따라 구글 Cloud Vision을 써 보려고 했습니다.

강좌들은 대부분 순서가 비슷했어요.

1. Cloud Storage 버킷 만들기
2. 서비스 계정 만들기
3. 서비스 계정에 권한(역할) 주기
4. json 키 파일 만들어서 내려받기

그런데 중간에 <strong>"보안 정책으로 막혀 있는 것을 먼저 풀어야 한다"</strong>는 단계가 끼어 있었고, 여기서부터 설정이 확 복잡해졌습니다. 조직, 정책, 권한 같은 낯선 말이 계속 나왔어요.

결론부터 말하면, <strong>이미지를 보내서 글자를 읽는 OCR만 할 거라면 json 키가 필요 없었습니다.</strong> Cloud Vision API는 API 키로도 쓸 수 있고, API 키는 그 정책의 영향을 받지 않습니다. 이 글에서는 왜 막히는지, 그리고 API 키로 어떻게 해결했는지를 정리합니다.

## 서비스 계정 키 생성이 막히는 이유: iam.disableServiceAccountKeyCreation

구글 클라우드에는 **조직 정책**이라는 것이 있습니다. 그중 `iam.disableServiceAccountKeyCreation`이라는 제약이 켜져 있으면 서비스 계정 키(json) 생성이 막힙니다.

최근에 만든 조직에는 이 제약이 기본으로 켜져 있을 수 있습니다. 그래서 예전에 만들어진 강좌와 똑같이 따라 했는데도 키 만들기 단계에서 막히는 일이 생깁니다. (2026년 10월 기준이며, 기본값은 바뀔 수 있으니 [구글 클라우드 공식 문서](https://cloud.google.com/resource-manager/docs/organization-policy/overview)도 함께 확인해 주세요.)

| 항목 | 내용 |
|---|---|
| 막는 제약 | `iam.disableServiceAccountKeyCreation` |
| 푸는 데 필요한 권한 | 조직 수준의 조직 정책 관리자 (`roles/orgpolicy.policyAdmin`) |
| 프로젝트 소유자라면? | 기본으로는 이 권한이 **없습니다** |
| 구글의 입장 | json 키는 유출 위험이 커서 권장하지 않음 |

프로젝트 소유자라도 조직 정책은 바꿀 수 없어서, 정책을 풀려면 조직 수준 권한부터 따로 받아야 합니다. 게다가 이 제약은 유출 위험을 줄이려고 걸어 둔 보안 장치라서, 굳이 끄기보다는 다른 길이 있는지 먼저 찾아보는 편이 낫습니다.

## 해결: Cloud Vision API는 API 키로 인증할 수 있다

Cloud Vision API는 **API 키 인증**을 지원합니다. API 키는 서비스 계정 키가 아니므로 위 정책에 걸리지 않습니다.

| 구분 | 서비스 계정 키(json) | API 키 |
|---|---|---|
| 형태 | json 파일 | `AIza`로 시작하는 문자열 |
| 조직 정책 영향 | `iam.disableServiceAccountKeyCreation`에 막힘 | 영향 없음 |
| 준비 과정 | 서비스 계정, 역할 부여, 키 생성 | 키 생성, 사용할 API 제한 |
| 쓸 수 있는 곳 | IAM 권한이 필요한 작업 전반 | API 키를 지원하는 API (Vision 등) |

다만 API 키를 쓰더라도 아래 두 가지는 여전히 필요합니다.

- 프로젝트에 **결제 계정 연결**
- 프로젝트에서 **Cloud Vision API 사용 설정**

## 방법 1: 콘솔에서 API 키 만들기

마우스로 하는 방법입니다. 시작하기 전에 콘솔 위쪽에서 사용할 프로젝트가 선택되어 있는지, 결제 계정이 연결되어 있는지 확인해 주세요.

1. **API 및 서비스 → 라이브러리**에서 'Cloud Vision API'를 찾아 **사용**을 누릅니다. (이미 켜져 있다면 건너뜁니다.)
2. **API 및 서비스 → 사용자 인증 정보**로 들어갑니다.
3. **사용자 인증 정보 만들기 → API 키**를 누릅니다.
4. 키가 만들어지면 **키 제한**으로 들어가서, API 제한에서 <strong>'Cloud Vision API'만 허용</strong>합니다.
5. 저장한 뒤 `AIza...`로 시작하는 키를 복사해 둡니다.

> 4번의 키 제한은 꼭 해 주세요. 제한이 없으면 이 키로 다른 API도 호출할 수 있어서, 유출됐을 때 피해가 커집니다.

## 방법 2: Cloud Shell에서 gcloud 명령어로 API 키 만들기

콘솔 메뉴를 찾아다니기 번거롭다면 Cloud Shell(브라우저에서 열리는 터미널)에서 명령어로 할 수도 있어요. 보통 콘솔 위쪽 도구 모음의 터미널 모양 아이콘(Cloud Shell 활성화)을 누르면 열립니다. 아이콘이 안 보이면 [Cloud Shell 아이콘이 안 보일 때](/blog/cloud-shell-icon-missing/) 글처럼 주소로 바로 열 수 있습니다. 명령어는 현재 선택된 프로젝트에 적용되니, 프로젝트가 맞는지 먼저 확인해 주세요.

먼저 필요한 API를 켭니다.

```bash
gcloud services enable vision.googleapis.com apikeys.googleapis.com
```

Vision API만 쓸 수 있도록 제한한 키를 만듭니다.

```bash
gcloud services api-keys create --display-name="PDF OCR" --api-target=service=vision.googleapis.com
```

방금 만든 키의 이름(리소스 이름)을 찾습니다.

```bash
gcloud services api-keys list --filter='displayName="PDF OCR"' --format='value(name)'
```

`projects/.../keys/...` 모양의 이름이 나옵니다. 이 이름을 아래 명령어에 넣으면 실제 키 문자열이 나옵니다.

```bash
gcloud services api-keys get-key-string <위에서 나온 이름> --format='value(keyString)'
```

`AIza`로 시작하는 문자열이 나오면 성공입니다. `--api-target` 옵션 덕분에 만들 때부터 Vision API로 제한된 상태라서, 콘솔에서 따로 제한을 걸 필요가 없습니다.

## 파이썬 코드에서 API 키 쓰기

`google-cloud-vision` 라이브러리를 쓴다면 클라이언트를 만들 때 `client_options`로 키를 넘기면 됩니다.

```python
from google.cloud import vision

client = vision.ImageAnnotatorClient(client_options={"api_key": "AIza..."})
```

예시라서 키를 코드에 바로 적었지만, 실제로는 설정 파일이나 환경 변수에서 읽어 오는 편이 안전합니다. (아래 보안 수칙 참고)

json 키 방식과 비교하면 이렇습니다.

```python
# json 키 방식 (서비스 계정)
from google.cloud import vision
from google.oauth2 import service_account

credentials = service_account.Credentials.from_service_account_file("key.json")
client = vision.ImageAnnotatorClient(credentials=credentials)
```

클라이언트를 만드는 한 줄만 바뀌고, 이후 OCR 요청 코드는 같습니다.

## 실제로 해 보니: 연결 테스트와 API_KEY_INVALID 오류

만든 PDF OCR 프로그램에 API 키 입력 칸을 추가했더니, <strong>정책 문제 없이 바로 동작했습니다.</strong> 버킷도, 서비스 계정도, 역할 부여도 필요 없었어요.

프로그램의 연결 테스트 기능은 64x64 크기의 빈 이미지를 Vision API로 보내서 키가 제대로 동작하는지 확인합니다. 빈 이미지라 인식되는 글자는 없지만, 오류 없이 응답이 오면 키와 설정이 정상이라는 뜻입니다.

키를 잘못 넣었을 때는 아래 오류가 났습니다.

```text
API_KEY_INVALID (API key not valid)
```

키를 복사할 때 앞뒤 공백이 들어갔거나 일부가 빠졌는지 먼저 확인해 보세요.

키가 맞는데도 안 된다면 프로젝트 설정 쪽을 봐야 합니다. 일반적으로는 이렇게 나뉩니다. 정확한 오류 문구는 상황에 따라 다를 수 있어요.

| 오류에 보이는 말 | 의심할 것 |
|---|---|
| `API_KEY_INVALID` | 키 자체가 틀림 (복사 실수, 삭제된 키) |
| `BILLING_DISABLED` 류 | 프로젝트에 결제 계정이 연결되지 않음 |
| `SERVICE_DISABLED` 류 | 프로젝트에서 Vision API가 사용 설정되지 않음 |

요금이 얼마나 나오는지는 [Vision OCR 요금과 무료 크레딧 정리](/blog/google-vision-ocr-pricing/) 글에 따로 정리했습니다.

## API 키 쓸 때 꼭 지킬 보안 수칙

API 키는 편한 만큼 관리를 잘 해야 합니다. <strong>API 키로 들어온 요청은 '누가 썼는지'가 아니라 '이 프로젝트 요금'으로 청구됩니다.</strong> 키가 새면 다른 사람이 쓴 요금도 내 프로젝트로 나옵니다.

- 키를 <strong>코드에 직접 적어서 깃허브에 올리지 마세요.</strong> 설정 파일이나 환경 변수로 분리하고, 그 파일은 저장소에 올리지 않습니다.
- **API 제한은 반드시** 걸어 주세요. Vision만 쓴다면 Vision만 허용합니다.
- 필요하면 **애플리케이션 제한**(특정 IP, 웹사이트 등)도 함께 겁니다.
- 다른 사람과 <strong>키를 공유하지 마세요.</strong> 필요한 사람은 각자 자기 프로젝트에서 키를 만들게 하는 편이 안전합니다.
- 유출이 의심되면 **바로 키를 삭제하고 새로 발급**합니다.

## 그래도 json(서비스 계정)이 필요한 경우

API 키가 모든 걸 대신하지는 않습니다. 아래와 같은 경우에는 서비스 계정이 필요합니다.

| 하려는 작업 | API 키로 충분? |
|---|---|
| 이미지를 직접 보내서 Vision OCR | 충분 |
| Cloud Storage 버킷 읽기·쓰기 등 IAM 권한이 필요한 작업 | 서비스 계정 필요 |
| 서버끼리 인증해야 하는 작업 | 서비스 계정 필요 |

강좌들이 버킷부터 만들었던 이유도 여기에 있습니다. PDF를 버킷에 올려서 처리하는 방식은 Cloud Storage 권한이 필요하니까 서비스 계정이 따라오는 거예요. 저는 [OCR 프로그램](/blog/pdf-ocr-program/)에서 PDF 페이지를 하나씩 이미지로 바꿔서 직접 보내는 방식을 택했기 때문에 버킷도 json 키도 필요 없었습니다.

## 자주 묻는 질문

### 프로젝트 소유자인데 왜 정책을 못 바꾸나요?

조직 정책을 바꾸려면 조직 수준의 조직 정책 관리자 권한(`roles/orgpolicy.policyAdmin`)이 필요합니다. 프로젝트 소유자에게는 기본으로 이 권한이 없습니다.

### API 키로 Cloud Storage 버킷도 쓸 수 있나요?

아니요. 버킷 읽기·쓰기처럼 IAM 권한이 필요한 작업에는 서비스 계정이 필요합니다. API 키는 Vision처럼 API 키를 지원하는 API에 이미지를 직접 보낼 때 씁니다.

### API 키를 써도 결제 연결이 필요한가요?

네. API 키를 쓰더라도 프로젝트에 **결제 계정 연결**과 **Cloud Vision API 사용 설정**은 필요합니다.

## 정리: 막혔을 때 체크리스트

- [ ] 하려는 작업이 **Vision에 이미지를 직접 보내는 OCR**인가? 그렇다면 API 키로 충분합니다.
- [ ] 프로젝트에 **결제 계정**이 연결되어 있는가?
- [ ] **Cloud Vision API**가 사용 설정되어 있는가?
- [ ] API 키에 **Cloud Vision API만 허용**하는 제한을 걸었는가?
- [ ] 키를 코드나 깃허브에 그대로 두지 않았는가?
- [ ] 버킷이나 서버 간 인증이 꼭 필요하다면, 그때만 서비스 계정과 조직 정책 문제를 다룬다.

조직 정책을 억지로 풀기 전에, 정말 json 키가 필요한 작업인지 먼저 따져 보세요. 저처럼 OCR만 하려던 거라면 API 키 하나로 훨씬 간단하게 끝납니다. 콘솔 화면 구성이나 정책 기본값은 바뀔 수 있으니(2026년 10월 기준), 진행하다 다르게 보이면 [API 키 관리 공식 문서](https://cloud.google.com/docs/authentication/api-keys)를 함께 확인해 주세요.
