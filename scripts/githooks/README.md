# git hooks
활성화(1회): `git config core.hooksPath scripts/githooks`
- `pre-push`: apps/web·packages/ai `tsc --noEmit`. 건너뛰기 `SKIP_PREPUSH=1 git push`.
Vercel 빌드는 lint/tsc 를 생략하므로(next.config 주석 참고) 이 훅 + GitHub Actions CI 가 타입 게이트다.
