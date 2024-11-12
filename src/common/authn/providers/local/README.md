# ! WORK IN PROGRESS - NOT USABLE YET !

# Local Authn Provider

## Install

```bash
yarn add jsonwebtoken
```

## Configuration

```yaml
authn:
  local:
    magicLinks:
      enabled: true
      registration: true
      registrationRedirect: 'http://localhost:3000/register'
    passwords:
      enabled: true
      registration: true
```


## Stronger passwords

todo, argon2, salting, etc.
