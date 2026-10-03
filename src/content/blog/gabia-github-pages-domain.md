---
title: "가비아 도메인을 GitHub Pages에 연결하기: 레코드는 맞는데 안 될 때"
description: "가비아 도메인을 GitHub Pages에 연결하는 A 레코드·CNAME 설정과, 레코드가 맞는데도 Server failed가 뜬 원인(남아 있던 AWS 네임서버) 해결, HTTPS 인증서 발급까지 정리했습니다."
pubDate: 2026-10-03
category: "블로그 운영"
tags: ["가비아", "GitHub Pages", "도메인 연결", "DNS", "네임서버"]
cover: "/images/gabia-github-pages-domain/cover.png"
draft: false
---

이 블로그는 Astro로 만들고 GitHub Pages로 배포합니다. 주소는 가비아에서 산 도메인 `ajejeiya.cloud`를 씁니다. 인터넷에 나온 대로 가비아 DNS에 레코드를 넣었는데, <strong>레코드는 분명히 맞는데 사이트가 열리지 않았습니다.</strong>

원인은 레코드가 아니라 **네임서버**였어요. 레코드를 아무리 고쳐도 소용없는 상황이라 시간을 꽤 썼습니다. 같은 문제로 검색해서 들어오신 분이 덜 헤매도록 순서대로 정리합니다.

## 전체 구성 먼저 보기

| 구분 | 설정 |
|---|---|
| 블로그 | Astro로 만들고 GitHub 저장소에 올림 |
| 배포 | GitHub Actions로 자동 배포 |
| GitHub 쪽 | Pages 설정에서 사용자 지정 도메인 입력, `public/CNAME` 파일에 도메인 적기 |
| 가비아 쪽 | DNS 설정에 A 레코드 4개 + CNAME 1개 |

`public/CNAME` 파일은 내용이 도메인 한 줄뿐입니다.

```text
ajejeiya.cloud
```

## 1단계: 가비아 DNS에 GitHub Pages A 레코드·CNAME 넣기

가비아에서는 **My가비아 → 서비스 관리 → 도메인 → [관리] → DNS 정보 → DNS 설정**으로 들어갑니다. 여기에 아래 다섯 개를 넣었습니다.

| 타입 | 호스트 | 값 |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | supergangy.github.io. |

A 레코드 4개는 GitHub Pages의 IP이고, CNAME은 `www`로 들어와도 연결되게 하는 설정입니다. `supergangy` 자리에는 본인 GitHub 아이디를 넣으면 됩니다. IP는 바뀔 수 있으니 넣기 전에 [GitHub 공식 문서](https://docs.github.com/ko/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)에서 한 번 확인하세요(2026년 10월 기준 위 4개).

> **가비아 주의점**: CNAME 값 끝에 <strong>점(.)</strong>을 꼭 붙이세요. 점이 없으면 값 뒤에 내 도메인이 자동으로 붙어서 엉뚱한 주소가 됩니다.

### 첫 번째 실수: 저장을 안 했어요

레코드를 입력하고 나서 화면을 다시 보니 <strong>'레코드 개수: 2개'</strong>로 나와 있었습니다. 입력만 해 두고 저장하기 전 상태였던 거예요. 넣은 레코드 수만큼 개수가 늘었는지, 저장 버튼까지 눌렀는지 꼭 확인하세요.

## 2단계: 레코드가 맞는데 'Server failed'가 뜰 때

저장까지 했는데도 사이트가 열리지 않았습니다. 윈도우 명령 프롬프트에서 확인해 봤어요.

```bat
nslookup ajejeiya.cloud 8.8.8.8
```

결과는 계속 <strong>`Server failed`</strong>였습니다. 레코드가 틀렸다면 엉뚱한 IP라도 나와야 하는데, 아예 응답이 실패하는 거예요. 도메인의 네임서버(NS)를 직접 조회해도 마찬가지였습니다.

```bat
nslookup -type=NS ajejeiya.cloud
```

### 진짜 원인: 네임서버가 AWS로 남아 있었다

도메인 등록 정보를 확인할 수 있는 RDAP로 조회해 봤습니다. 브라우저 주소창에 아래처럼 넣으면 됩니다.

```text
https://rdap.org/domain/ajejeiya.cloud
```

결과를 보니 네임서버가 가비아가 아니라 **AWS Route 53**(`ns-136.awsdns-17.com` 등 4개)으로 되어 있었고, 마지막 변경일은 2026-09-09였습니다.

예전에 사이트 HTTPS 인증서 때문에 Route 53을 연결해 본 적이 있었는데, AWS 쪽 설정은 지우고 **네임서버만 그대로 남아 있었던** 거예요. 인터넷은 "이 도메인은 AWS에 물어봐"라고 안내하는데, AWS에는 이미 아무것도 없으니 실패할 수밖에 없었습니다. 그래서 **가비아 DNS에 뭘 넣어도 반영되지 않았던** 겁니다.

| 증상 | 의심할 것 |
|---|---|
| 엉뚱한 IP가 나옴 | 레코드 값 오류, 예전 레코드 남아 있음 |
| `Server failed` | 네임서버(위임) 문제일 수 있음 |
| 응답은 정상인데 사이트가 안 열림 | GitHub Pages 설정, CNAME 파일 |

### 예전 레코드도 하나 숨어 있었어요

가비아 네임서버에 직접 물어보니, 한 곳에서 예전에 넣었던 `A @ 52.79.162.53`(AWS 서울 지역 IP)이 같이 나왔습니다. GitHub Pages와 상관없는 기존 레코드이니 가비아 DNS 설정에서 지워야 합니다. 특정 네임서버에 직접 묻는 명령은 이렇습니다.

```bat
nslookup ajejeiya.cloud ns.gabia.co.kr
```

## 3단계: 가비아 네임서버로 변경하기

<strong>My가비아 → 서비스 관리 → 도메인 → 해당 도메인의 [관리] → 네임서버 [설정]</strong>에서 가비아 네임서버로 바꿨습니다. "가비아 네임서버 사용"을 고르거나 아래 3개를 직접 입력하고, 남아 있던 AWS 주소 4개는 지웠습니다.

```text
ns.gabia.co.kr
ns1.gabia.co.kr
ns.gabia.net
```

등록 정보에는 바로 반영됐고, 가비아 서버 3곳은 즉시 올바른 IP 4개를 응답했습니다. 다만 공용 DNS는 조금 늦었어요.

| DNS 서버 | 결과 |
|---|---|
| 가비아 네임서버 3곳 | 변경 직후 정상 |
| 구글 (8.8.8.8) | 처음엔 실패, 약 6분 뒤 정상 |
| 클라우드플레어 (1.1.1.1) | 처음엔 실패, 약 6분 뒤 정상 |
| KT (168.126.63.1) | 처음엔 실패, 약 6분 뒤 정상 |

제 경우는 6분 정도였지만, 보통 수 분에서 수 시간, 길면 하루까지 걸릴 수 있습니다. 바꾸자마자 안 된다고 다시 건드리지 말고 조금 기다려 보세요.

## 4단계: GitHub Pages HTTPS 인증서가 발급되지 않을 때

이제 `http://`로는 열렸는데, `https://`로 들어가면 브라우저에 <strong>"이 사이트는 보안 연결을 지원하지 않습니다"</strong> 경고가 떴습니다. GitHub Pages API로 인증서 상태를 확인해 보니 <strong>약 30분 동안 계속 비어 있었어요.</strong> 발급이 시작조차 안 된 상태였습니다. 정확한 이유는 알 수 없지만, DNS가 제대로 잡히기 전에 도메인을 등록해 둔 것과 관련이 있지 않을까 짐작합니다.

해결은 간단했습니다.

1. 저장소의 **Settings → Pages**에서 사용자 지정 도메인을 지우고 저장
2. 같은 도메인을 다시 입력하고 저장
3. 1분 안에 인증서 상태가 `approved`로 바뀜
4. **Enforce HTTPS**를 켬

그 뒤로는 `http://`로 들어오면 `https://`로 301 이동하고, `www`로 들어오면 루트 도메인으로 이동합니다. 인증서에는 루트와 `www`가 둘 다 들어 있고, GitHub가 Let's Encrypt로 **자동 발급·갱신**하기 때문에 따로 할 일은 없습니다. HTTPS 때문에 Route 53을 쓸 필요도 없었어요.

## 남은 정리: 쓰지 않는 Route 53 호스팅 영역

Route 53에 호스팅 영역이 남아 있으면 쓰지 않아도 **영역당 월 약 0.5달러**가 청구됩니다(2026년 10월 기준, 정확한 요금은 [AWS 공식 요금 페이지](https://aws.amazon.com/ko/route53/pricing/)에서 확인하세요). 네임서버를 가비아로 옮겼다면 AWS 콘솔에서 해당 호스팅 영역을 삭제하는 게 좋습니다. 지우기 전에 확인할 것과 삭제 순서는 [안 쓰는 AWS Route 53 호스팅 영역 정리하기](/blog/aws-route53-hosted-zone-cleanup/)에 따로 정리했습니다.

## 자주 묻는 질문

### DNS 반영은 얼마나 걸리나요?

제 경우는 네임서버를 바꾸고 약 6분 뒤에 구글·클라우드플레어·KT 공용 DNS에서 모두 정상으로 나왔습니다. 보통은 수 분에서 수 시간, 길면 하루까지 걸릴 수 있습니다.

### HTTPS를 쓰려면 Route 53이 필요한가요?

아니요. GitHub Pages가 Let's Encrypt로 인증서를 **자동 발급·갱신**해 줍니다. 인증서가 안 나오면 Pages 설정에서 도메인을 지웠다가 다시 입력해 보세요.

### www로 들어와도 열리게 하려면?

가비아 DNS에 `CNAME` 레코드를 호스트 `www`, 값 `아이디.github.io.`로 넣으면 됩니다. 값 끝의 <strong>점(.)</strong>을 빠뜨리지 마세요.

### nslookup에 Server failed가 뜨면?

레코드보다 <strong>네임서버(위임)</strong>를 먼저 확인하세요. `nslookup -type=NS 도메인`이나 RDAP로 네임서버가 가비아인지 보면 됩니다.

## 정리: 레코드가 맞는데 안 되면 이 순서로

- [ ] 가비아 DNS 설정에서 **저장**까지 했는지 (레코드 개수 확인)
- [ ] CNAME 값 끝에 <strong>점(.)</strong>이 있는지
- [ ] `nslookup -type=NS 도메인`으로 **네임서버가 가비아인지**
- [ ] RDAP(`https://rdap.org/domain/도메인`)로 등록된 네임서버 확인
- [ ] `nslookup 도메인 ns.gabia.co.kr`로 **예전 레코드**가 남아 있지 않은지
- [ ] 네임서버를 바꿨다면 공용 DNS(`8.8.8.8`)에 반영될 때까지 기다리기
- [ ] 인증서가 안 나오면 Pages에서 **도메인을 지웠다가 다시 입력**
- [ ] 인증서가 나오면 **Enforce HTTPS** 켜기
- [ ] 안 쓰는 Route 53 호스팅 영역 삭제 ([삭제 순서 보기](/blog/aws-route53-hosted-zone-cleanup/))

가장 큰 교훈은 **레코드가 맞는데 안 되면 네임서버부터 보라**는 것입니다. `Server failed`는 레코드 문제가 아니라 위임(네임서버) 문제의 신호일 수 있어요. 블로그를 어디에 만들지 고민 중이라면 [네이버 블로그, 티스토리, 직접 만든 블로그 비교](/blog/naver-tistory-own-blog/) 글도 참고해 보세요.
