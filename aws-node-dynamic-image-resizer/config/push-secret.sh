echo "💾  $(tput bold)Push secret$(tput sgr0)"

if [ "$#" -lt 2 ]; then
  printf "Secret key: "
  read key
  printf "Secret value: "
  read value
else
  value=$1
  key=$2
fi;

aws ssm put-parameter --name $key --value $value --type SecureString --region ap-southeast-1 --overwrite
