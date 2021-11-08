# Make your life easier in making Production Emails

##Installation

Be sure that you have nodejs npm or nvm installed in your machine

- To check type in your terminal

node --version

nvm --version

Assuming that you chose nvm version (which is easy to install and maintain for difference version of nodejs)

in MacOS without the Brew

###Check out first which shell are you using

- Run the command in the terminal:

ps -p $$

then install

- Bash:

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash

- ZSH

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | zsh

###Installing Node

- To install the latest node

nvm install node # "node" is an alias for the latest version

- Check if npm is installed

npm --version

If not, install the latest npm

nvm install-latest-npm

## Installing ProdEmailCampaignGulp

- In the terminal

git clone https://github.com/battlecheeze/prodemailcampaigngulp

then go to the folder where prodemailcampaigngulp is cloned

Then type

npm install 

This might take a while because it will install it's dependencies

## Running the prodemailcampaigngulp

To run:

type in the terminal 

```bash

gulp

```
Or

```zsh
npm start
```

to build your production email

```zsh
npm run build
```



