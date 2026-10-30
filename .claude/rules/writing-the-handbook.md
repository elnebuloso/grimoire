## User documentation

The docs are a manual for the people who use the product, not a record of
how it was built. Write for the reader named at the top of each page and
for nobody else. Content for another reader goes on that reader's page.

### Document only what the reader cannot see

The reader has the product in front of them. Do not describe the
interface: no "click X", no "the menu shows", no walking through screens
or where an action leads. If the interface needs a sentence to be
understood, that is a bug in the interface, not a gap in the docs.

A sentence earns its place only if it is one of:

1. A rule or limit the reader cannot see — durations, lockouts, minimum
   lengths, quotas, what is shown only once.
2. An error the reader will actually get — its exact text and what to do
   about it.
3. A warning before an irreversible or far-reaching action — what breaks,
   and for whom.
4. A decision the reader must make and the information needed to make it.

The test for every sentence: would the reader do anything differently
knowing this? If not, delete it.

### Never in user docs

- How it works: algorithms, hashing, cookies, storage, in-memory vs.
  persisted state, request handling, framework names, comparisons with
  other software.
- Why it was built this way, what it used to do, or what was considered.
- Reassurances ("this is safe because…"). State the rule, not its proof.
- Variables, files, or paths the reader never touches. A setting appears
  only on the page of the reader who sets it, and only when they must.

If a detail matters to maintainers, put it in a code comment or in a
separate internals document — never in the user docs.

### Form

Lead with the rule, the error, or the warning. Short, imperative
sentences; one idea per paragraph. No introductions, no summaries.
A section with nothing left in it is removed, not padded.

### Reviewing docs

Go through every sentence and ask who the reader is and what they would
do differently knowing it. Delete every sentence without an answer.
Move every sentence written for a different reader to their page.
