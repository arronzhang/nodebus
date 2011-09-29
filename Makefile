SSH= ~/.ssh/config
RSA= ~/.ssh/notihub_rsa
COLOR= \033[1;34m
COLOREND=\033[0m

test:
	@echo "Usage: \n  make ssh	Generate ssh key, add ssh config"
$(RSA):
	@echo "\n$(COLOR)Gengrate ssh key to $(RSA)$(COLOREND)\n"
	@ssh-keygen -t rsa -f $(RSA)
	@echo "\n$(COLOR)Now you can post the $(RSA).pub content to notihub.unfuddle.com$(COLOREND)\n"
	@cat $(RSA).pub
	@echo "\n"

ssh: $(RSA)
	@if ! test -f $(SSH) || ! grep -q notihub $(SSH); then \
		echo "\n$(COLOR)Add host notihub to $(SSH)$(COLOREND)\n";\
		echo "\nHost notihub.unfuddle.com \nHostName notihub.unfuddle.com \nIdentityFile $(RSA)" >> $(SSH);\
		fi;

.PHONY: test
