- **TEP**: [1](https://github.com/ton-blockchain/TEPs/pull/1)
- **title**: TEP Lifecycle
- **status**: Active
- **type**: Meta
- **authors**: [Vladimir Lebedev](https://github.com/hacker-volodya)
- **created**: 11.06.2022
- **replaces**: -
- **replaced by**: -

# Summary

This document introduces TEP -- TON Enhancement Proposal. TEP is a design document which describes some part of TON, for example ADNL (network protocol between nodes) or NFT (interface which is common to smart contracts of a single type).

# Motivation

Current TIP system is too informal to manage the process of writing, discussing and accepting new standards efficiently. TON needs a new proposal process, which will encourage authors to do a deep dive into the topic and write down all points to have a constructive discussion with the community.

# Guide

## For authors
If you have an idea for proposal, discuss it with community, for example in TON Dev chat ([en](https://t.me/tondev_eng)/[ru](https://t.me/tondev)). Discussion may help you to quickly identify potential gaps and not to spend a lot of time on writing actual proposal if you realized that your idea is not so clear as you thought before. Also you may look through the [TEP template](/0000-template.md) and think about each section first before writing.

When you feel yourself ready to write, just fork this repo and copy the template to `./text/0000-my-new-standard.md`, where "my-new-standard" is a short title of your TEP. Fill all sections and answer questions stated in template. If you need to include images or another additional files, upload them to `./assets/0000-my-new-standard/` folder.

Try to answer questions in the template as fully as possible. When the proposal is ready, open a [pull request](https://github.com/ton-blockchain/TEPs/pulls) and be ready to discuss your proposal with the community. During the review process, make changes to your pull request if it is necessary 

## For reviewers
After a pull request was created, any developer with corresponding experience (either from TON Foundation or community) may request repo maintainers to be assigned as a reviewer for the pull request. Anyone may comment the pull request, but reviewers has to vote, whether to merge or to reject the pull request. Once the majority votes for or against, TEP will enter its final comment period.

FCP lasts 10 calendar days, in this period the TEP is advertised widely. This way all stakeholders has a chance to say their final comments
on the TEP. Sometimes the FCP has to be cancelled because new arguments/ideas were raised. In this case the discussion restarts and then reviewers has to vote again.

# Specification

This section describes your feature formally. It contains requirements, which must be followed in order to implement your TEP. To keep things formal, it is convenient to follow [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt). You should include following text at the beginning of this section:

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

## TEP Roles

1. Author
2. Editor
3. Reviewer

## TEP Creation

The author SHOULD copy [TEP template](/0000-template.md) to `./text/0000-my-new-standard.md` and fill all sections. The author MAY include additional files, such as images and MUST place them in `./assets/0000-my-new-standard/`. All sections described below are mandatory.

### Header
Contains some TEP properties: TEP id and pull request link, title, status, type, authors, links to replaced TEPs and links to TEPs which replaces this TEP.

### Body
1. Summary
2. Motivation
3. Guide
4. Specification
5. Drawbacks
6. Rationale and alternatives
7. Prior art
8. Unresolved questions
9. Future possibilities

## TEP Lifecycle

### Draft
Author prepares TEP and opens a pull request to this repo. If necessary, Author MAY NOT start the review process, for example, if there is some unresolved questions, which must be solved before starting the review process. However, Editor MAY close the pull request in Draft state if there is no activity for the long time.

### Review
When the TEP is ready, Author has to start the review process by changing TEP state to *Review*. Editor checks the pull request and then reviewers has to be assigned by editor (author or anyone else MAY propose reviewers to be assigned to the pull request). Reviewers share their opinions in pull request, and if there was a discussion somewhere not in pull request, they MUST summarize it in pull request comments. Reviewers has to vote for or against the proposal. Once the majority agrees, Final Comment Period starts for 10 calendar days. Anyone MAY share their thoughts about this TEP, and Editor may cancel the FCP if there is a reason for it. In this case, the review process restarts, and reviewers MUST vote one more time in order to finish pull request. When FCP is over, Editor changes the state of TEP from Review to either Active or Rejected. 

### Active
When the TEP was accepted by reviewers, it becomes Active. It is possible to make minor changes to active TEPs in order to keep TEPs up to date with the actual implementation details.

### Rejected
When the TEP is rejected, corresponding pull request MUST NOT be merged, instead it MAY be closed. However, it is ok to keep rejected pull requests open, so the Author CAN make changes to the TEP and apply for review again without losing previous discussion.

### Replaced
At some point TEP may be deprecated. When this occurs, its state changes to Replaced. It is also necessary to provide some info about replacement in TEP header: "replaces" field points from new TEP to the old one, and "replaced by" points from the old TEP to the new.

# Drawbacks

## Who has to manage the process to get pull requests closed?
There is a risk that reviewers will not review pull requests in time, because there is no explicit manager or product owner, and motivation of reviewers is not clear.

# Rationale and alternatives

**Section list** was completely taken from Rust RFC. It motivates an author to do a deep dive into the TEP argumentation before starting the discussion with the community.

**RFC 822 header** from PEP/BIP/EIP/NEP was replaced by Rust RFC header, because it helps to improve user experience with links to TEP pull request and to the author of TEP.

In NEP, proposals are finalized before the actual pull request merging and proposal review. It unnecessarily sophisticates the process of review, because it is not easy for author to make small fixes to already merged pull request. So, to simplify all the things, in TEP entire review process is kept in pull request, so it is easy to do a review "ping-pong", when the author makes quick fixes during the review to achieve consensus with the community.

# Prior art

- Ethereum Improvement Proposals: [EIP-1](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1.md)
- Near Enhancement Proposals: [NEP-1](https://github.com/near/NEPs/blob/master/neps/nep-0001.md)
- [Rust RFCs](https://github.com/rust-lang/rfcs)

# Unresolved questions

1. Who has to assign reviewers? Who exactly can be a reviewer? How they will prove their experience and who will check it?

# Future possibilities

None
