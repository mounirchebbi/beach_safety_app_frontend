# Changelog: Replace api.getUsers with api.getAllUsers in SystemCenterManagement

## Summary
This patch updates the user management logic in SystemCenterManagement.tsx to use the correct API function for fetching users. All calls to `api.getUsers` are replaced with `api.getAllUsers`.

## Details
- The user management logic previously called `api.getUsers`, which does not exist in the current api.ts service file.
- All such calls are now replaced with `api.getAllUsers`, which is the correct function for fetching users from the backend.
- This resolves errors like: `Error loading users: _services_api__WEBPACK_IMPORTED_MODULE_1__.default.getUsers is not a function`.

## How to Revert
- Replace all calls to `api.getAllUsers` in `SystemCenterManagement.tsx` back to `api.getUsers` if you restore the old API function. 