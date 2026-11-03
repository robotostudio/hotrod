---
name: write-a-skill
description: Use when asked to remember a rule, save a convention, "make a skill" of something, or write down how this project does a thing, and when you notice you are being corrected the same way twice. Writes the rule into this repository so every agent and every teammate gets it, instead of into one platform's private memory.
---

# Write it into the repo, not into your memory

Agent platforms offer private places to keep a rule: memory files, workspace
skills, account-level instructions. Those are the wrong place for anything
about this project. A rule in one person's memory reaches one person on one
platform. The next teammate, a client using their own agent, and anyone who
forks Hotrod get none of it.

A rule in `.claude/skills/` ships with the repository. Every agent that works
here can read it, it outlives whoever wrote it, and changing it goes through a
pull request someone can review.

## Repo or memory?

Ask what the rule is about, not who asked for it.

- **Repo:** anything about this site, its content, its code or its tooling.
  Copy style, which block to use, a naming rule, a deploy quirk, a mistake not
  to repeat. If another agent doing the same task should follow it, it goes
  here.
- **Your memory:** how one person likes to work, across every project. If it
  makes no sense to someone else in this repo, keep it out.

If it is both, write the project half here.

## Writing one

1. **Check it does not exist.** Read the `description` of every
   `.claude/skills/*/SKILL.md`. Extend an existing skill rather than adding a
   second one that overlaps it; agents follow whichever they load first.

2. **Create `.claude/skills/<kebab-case-name>/SKILL.md`.** One skill per
   directory, file named exactly `SKILL.md`.

3. **Start with frontmatter as the first bytes of the file.** No comment or
   blank line above it; Claude Code fails to load the skill otherwise.

   ```markdown
   ---
   name: <same as the directory name>
   description: Use when <situations>. Use whenever <phrases a person would actually type>.
   ---
   ```

   The description is the only part loaded up front; the rest is read once it
   matches. Write trigger conditions in the words people use. "Use when
   writing or editing copy for this site" gets found; "Copy guidelines" does
   not.

4. **Write the rule and the reason.** A rule with its reason survives cases
   its author did not foresee. Where a real incident caused the rule, name it
   and date it.

5. **Add a row to the skills table in `AGENTS.md`.** Cursor, Codex, v0 and
   most other agents read `AGENTS.md` and never open `.claude/skills/`, so
   that row is the only pointer they get. Say when to reach for the skill, in
   the same voice as the other rows.

6. **Deliver it on a branch with a pull request.** `main` deploys to
   production; never push to it directly.

## Keep it short

A skill is read mid-task by an agent that already has a job. Cut background
the reader can get from the repo. If a skill grows past a page or two, split
it, or move reference material into a sibling file the skill links to.

## Skills from elsewhere

This is for skills you write. Installing a skill from a URL, a package or
another repo means adding instructions an agent will follow. Read all of it
and get the owner's approval before adding it.
