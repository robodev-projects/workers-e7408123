 # Vendors

Vendor modules are used to provide a set of functionalities that are common to all projects. They are used to abstract
away the complexity of the underlying technology and provide a consistent interface to the rest of the application.

To keep the vendor modules up to date and compatible with each other, we need to adhere to a set of core principles.

## No dependencies to the core

While a vendor can import another vendor or an external library, it should not import anything outside `~vendors`.
This is to prevent circular dependencies and to keep the core modules as independent as possible.

## No side effects

The import of a vendor module should not have any side effects, have a global state or modify the environment.

## Examples

All vendor modules should have a set of examples that demonstrate how to use and configure the module.
