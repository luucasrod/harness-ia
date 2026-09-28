# LIÇÃO 1.3 - Quick Reference Card

## Git Flow vs. Trunk-Based: 1-Minute Decision

`
Team size?     Releases?              Solution
≤5 people  +   Multiple/week      →   Trunk-Based ✅
10+ people +   Monthly/Quarterly   →   Git Flow ✅
Mixed                               →   Hybrid (start Git Flow)
`

---

## Conventional Commits: Template

`ash
# Format
<type>(<scope>): <description>

# Examples
feat(auth): add JWT token refresh        ✅ Good
fix(api): handle null response           ✅ Good
refactor(db): optimize queries           ✅ Good

# Bad
fix stuff                                ❌ Too vague
feat: add authentication and fix bugs    ❌ Multiple types
`

**Types:** feat, fix, docs, style, refactor, perf, test, chore, ci

---

## Branch Lifecycle: TL;DR

`ash
# 1. Create (off develop)
git checkout develop && git pull
git checkout -b feature/my-feature

# 2. Work (3-5 semantic commits)
git commit -m "feat(auth): step 1"
git commit -m "feat(auth): step 2"
git commit -m "test(auth): add tests"

# 3. Sync (rebase, never merge)
git rebase origin/develop

# 4. Push & PR
git push origin feature/my-feature
# → Create PR on GitHub

# 5. Code Review (24h turnaround)
# → 2 approvals needed

# 6. Merge
git checkout develop
git pull origin develop
git merge --no-ff feature/my-feature
git push origin develop
`

---

## Naming Convention: Examples

`
✅ feature/user-authentication
✅ bugfix/profile-image-corruption
✅ refactor/auth-service
✅ docs/deployment-guide

❌ feature/1
❌ john/auth-stuff
❌ FEATURE-USER-AUTH-V2-FINAL
`

**Pattern:** type/kebab-case-description

---

## Code Review: Checklist

- [ ] Solves the problem described?
- [ ] No duplicate code (DRY)?
- [ ] Edge cases handled? (null, empty, limits)
- [ ] Tests added/passing?
- [ ] No secrets hardcoded?
- [ ] Performance ok? (no N+1, etc)
- [ ] Follows project conventions?
- [ ] Documentation updated?

---

## Merge Conflicts: Resolution Steps

`ash
# 1. See conflict
git merge develop
# CONFLICT in file.ts

# 2. Edit file (resolve manually)
# OR use GUI:
git config merge.tool vscode
git mergetool

# 3. Mark resolved
git add file.ts

# 4. Complete merge
git commit -m "merge: resolve conflict in file.ts"
`

**Pro tip:** Rebase before merge to avoid conflicts:
`ash
git rebase origin/develop  # ← Before pushing
`

---

## Commands: Frequently Used

`ash
# See history
git log --oneline --graph --decorate

# See commits by type
git log --grep="^feat:" --oneline

# Rebase interactively (squash commits)
git rebase -i origin/develop

# Undo last commit (not published)
git reset --soft HEAD~1

# Who changed what?
git blame src/auth.ts

# Find breaking commit (binary search)
git bisect start
git bisect bad
git bisect good v1.0
`

---

## Automation Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **commitizen** | Force Conventional Commits | npm i -g commitizen |
| **standard-version** | Auto changelog + versioning | npm i --save-dev standard-version |
| **husky** | Git hooks (pre-commit) | npm i husky |
| **commitlint** | Lint commit messages | npm i --save-dev commitlint |

**Usage:**
`ash
# Use commitizen instead of git commit
cz commit
# OR
git cz

# Auto-bump version & generate changelog
npx standard-version
`

---

## Anti-Patterns (Don't Do These)

❌ "git commit -m fix stuff"  
❌ "Branch living 3 weeks"  
❌ "Code review after 2 weeks"  
❌ "Merging 50 commits at once"  
❌ "No tests before merge"  
❌ "Hardcoded API keys in code"  

✅ Use Conventional Commits  
✅ Keep branches ≤ 2 days  
✅ Review within 24h  
✅ Squash/rebase before merge  
✅ Always add tests  
✅ Use .env for secrets  

---

## Quiz Answers

**Q1:** Git Flow vs. Trunk-Based for 3 people, 2x/week deploy?  
**A:** Trunk-Based (question 1)

**Q2:** Which Conventional Commit is correct?  
**A:** fix(auth): add token refresh mechanism (question 2)

**Q3:** Merge or Rebase for unpublished branch?  
**A:** Rebase for clean history (question 3)

**Q4:** Professional code review feedback?  
**A:** Specific, with code example (question 4)

**Q5:** Git Flow: which branch is correct?  
**A:** main → develop → feature/* (question 5)

---

## Exercise: 20-Minute Hands-On

See LIÇÃO_1.3_Git_Collaboration.md → Exercise section

Expected output after 20 min:
- 3 feature commits with Conventional Commits
- 1 merge conflict resolved
- Linear git history (with --graph)
- v1.0.0 tag created

---

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Trunk-Based Development](https://cloud.google.com/architecture/devops/devops-tech-trunk-based-development)
- [A Successful Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)

---

**Print this sheet** and keep it on your desk 📌

**Time to Mastery:** 1-2 weeks of daily practice
