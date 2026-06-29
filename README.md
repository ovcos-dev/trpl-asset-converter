# trpl — Asset Converter

PNG 압축, WebP 변환, APNG 생성을 위한 데스크탑 앱

**made by ovcos ©**

---

## 다운로드

[Releases](https://github.com/ovcos-dev/trpl-asset-converter/releases) 페이지에서 최신 버전을 다운로드하세요.

| 플랫폼 | 파일 |
|--------|------|
| Windows | `trpl Asset Converter-x.x.x.exe` |
| macOS | `trpl Asset Converter-x.x.x-arm64.dmg` |

---

## 설치

### Windows
별도 설치 없이 `.exe` 파일을 바로 실행하면 됩니다.

### macOS
1. `.dmg` 파일을 다운로드합니다.
2. 마운트 후 `Applications` 폴더로 드래그합니다.
3. 처음 실행 시 **"손상되었습니다"** 메시지가 뜰 수 있습니다. 아래 방법으로 해결하세요.

#### macOS 손상 오류 해결
터미널을 열고 아래 명령어를 실행하세요.

```bash
xattr -cr /Applications/trpl\ Asset\ Converter.app
```

또는 **시스템 설정 → 개인정보 보호 및 보안 → 보안** 에서 **확인 없이 열기** 버튼을 클릭하세요.

> 이 메시지는 Apple 코드 서명이 없어서 발생하는 것으로 앱 자체에는 문제가 없습니다.

---

## 기능

- **PNG 압축**: 품질을 유지하면서 파일 크기를 줄입니다.
- **WebP 변환**: PNG를 WebP 포맷으로 변환합니다.
- **APNG 생성**: 여러 PNG 프레임을 애니메이션 PNG로 만듭니다.