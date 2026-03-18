# Branch Protection Rules for `master`

These settings should be configured in GitHub at:
**Settings > Branches > Add branch protection rule**

## Recommended Configuration

### Branch name pattern
```
master
```

### Required settings

1. **Require a pull request before merging**
   - Required approving reviews: **1** (minimum)
   - Dismiss stale pull request approvals when new commits are pushed: **Yes**
   - Require review from code owners: **Optional** (enable if CODEOWNERS file exists)

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: **Yes**
   - Required status checks:
     - `build`
     - `test`
     - `lint`

3. **Do not allow force pushes**
   - This prevents history rewriting on the protected branch.

4. **Do not allow deletions**
   - Prevents accidental deletion of the master branch.

### Optional (recommended)

5. **Require signed commits**: Optional but recommended for compliance.
6. **Require linear history**: Keeps the commit graph clean (squash or rebase merges only).
7. **Include administrators**: Apply rules even to repo admins.

## How to Set Up

1. Go to the repository on GitHub.
2. Click **Settings** > **Branches**.
3. Under "Branch protection rules", click **Add rule**.
4. Enter `master` as the branch name pattern.
5. Check the boxes as described above.
6. Under "Require status checks to pass", search for and add: `build`, `test`, `lint`.
7. Click **Create** (or **Save changes**).

## Notes

- The status check names (`build`, `test`, `lint`) correspond to the job names in `.github/workflows/ci.yml`.
- Status checks only appear in the dropdown after the CI workflow has run at least once on the repository.
- If you rename jobs in the CI workflow, update the required status checks accordingly.
