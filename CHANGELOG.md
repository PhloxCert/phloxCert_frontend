# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- **Landing Page Data Persistence**: Fixed a bug where `localName` would persist from a previous successful request when a new request for a non-existent DID was made.
- **Technician Dashboard Validation**: Improved the upload flow to validate and restrict notarization to Business DIDs only.

### Changed
- **Localization**: Translated all remaining Italian comments, UI labels, and sample data to English.
- **Refactoring**: Standardized the use of `localName` across `Landing.jsx` and `App.jsx`, removing redundant `localStorage` dependencies.
- **Frontend Implementation**: Changed the logic in order to permit only to the technician to upload documents and to the business to view them.

## [1.0.1] - 24-03-2026

### Fixed
- **Sidebar Logo**: Fixed the logo path in the sidebar to use the public path instead of the relative path.

## [1.0.0] - 20-03-2026

### Added
- **Public Verification Landing Page**: Introduced `/landing/did:iota:address` for consumer-facing safety audits.
- **Non-Wallet Verification**: Allowed public users to verify document integrity against on-chain SHA256 hashes without needing a wallet.
- **Interactive Details Modal**: Replaced inline DID display with a clean info icon that opens a comprehensive metadata modal.
- **Dual-Identity Support**: Frontend now passes and displays both `uploaderDid` and `activityDid`.
- **Enhanced History View**:
  - Clickable off-chain document links.
  - Automatic sorting by creation date (Latest first).
  - Copy-to-clipboard functionality for Object IDs to check on the Explorer.
- **Environment Variables**: Integrated `VITE_PACKAGE_ID` and `VITE_REGISTRY_ID` for dynamic contract interaction.
- **Initial project structure** with Vite and Tailwind CSS.
- **Modular architecture** with `@iota/core` and `@iota/ui` aliases.
- **Basic dashboard layout** and "Safety Pulse" component.
- Deleted Digital Assets test from the Dashboard.
- Added **TechnicianDashboard** with pending/certified document queue and wallet-signed VC issuance flow via useSignPersonalMessage
- Added **BusinessDashboard** with certification status badges, full document history table, and a details modal showing VC issuer, certification date, and on-chain object ID

### Fixed
- **State Persistence**: Resolved issue where `ownerName` was not correctly saved to `localStorage` during registration.
- **Modal Scope**: Fixed `ReferenceError` by moving `statusStyles` to a higher component scope in `History.jsx`.

### Changed
- Refactored `Dashboard.jsx` to use real production data instead of mocked certifications.
- Moved upload logic into a modal-based workflow for better UX.
- Feature (Technician): Added did lookup, certification uploads, and notarization payment flow.
- Feature (Business): Enabled viewing of technician-uploaded certifications.


