# Text Replace Enhanced

Text Replace Enhanced is an [Equicord](https://github.com/Equicord/Equicord) User Plugin based on the official Text Replace plugin. Modifications include:
- Replacements run on all existing messages instead of only other user's messages
- Added *Except if includes* option to the replacement rules
- *Only/Except if includes* options accept Regular Expressions in regex replacement rules

## Install

[Build Equicord](https://docs.equicord.org/building-from-source) from source then run the following commands:
``` 
cd src/userplugins
git clone https://github.com/hachigodesu/Text-Replace-Enhanced.git
pnpm build
```

## Update
```
cd src/userplugins/Text-Replace-Enhanced
git pull
pnpm build
```

## Credit
- [Original Vencord Plugin](https://vencord.dev/plugins/TextReplace)
- [Equicord](https://github.com/Equicord/Equicord)