// Banded DTW. usage: dtw A.bin B.bin nA nB dim band out.bin   (float32 features, row-major, unit-norm rows)
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
int main(int c, char**v){
  int nA=atoi(v[3]), nB=atoi(v[4]), dim=atoi(v[5]), band=atoi(v[6]);
  float *A=malloc((size_t)nA*dim*4), *B=malloc((size_t)nB*dim*4);
  FILE*f=fopen(v[1],"rb"); fread(A,4,(size_t)nA*dim,f); fclose(f);
  f=fopen(v[2],"rb"); fread(B,4,(size_t)nB*dim,f); fclose(f);
  float pen=getenv("PEN")?atof(getenv("PEN")):0.12f;
  int W=2*band+1;
  float *D=malloc((size_t)nA*W*4); unsigned char *P=malloc((size_t)nA*W);
  for(size_t k=0;k<(size_t)nA*W;k++){D[k]=1e30f;P[k]=0;}
  double slope=(double)nB/nA;
  #define IDX(i,j) ((size_t)(i)*W + ((j)-((int)((i)*slope)-band)))
  for(int i=0;i<nA;i++){
    int cj=(int)(i*slope); int j0=cj-band, j1=cj+band; if(j0<0)j0=0; if(j1>=nB)j1=nB-1;
    for(int j=j0;j<=j1;j++){
      float d=0; const float*a=A+(size_t)i*dim,*b=B+(size_t)j*dim;
      for(int k=0;k<dim;k++) d+=a[k]*b[k]; d=1.0f-d;
      float best=1e30f; unsigned char p=0;
      if(i==0&&j==0){best=0;p=0;}
      else{
        if(i>0&&j>0){ int pj=j-1, pc=(int)((i-1)*slope)-band; int o=pj-pc; if(o>=0&&o<W){float x=D[(size_t)(i-1)*W+o]; if(x<best){best=x;p=1;}}}
        if(i>0){ int pc=(int)((i-1)*slope)-band; int o=j-pc; if(o>=0&&o<W){float x=D[(size_t)(i-1)*W+o]+pen; if(x<best){best=x;p=2;}}}
        if(j>j0){ float x=D[IDX(i,j-1)]+pen; if(x<best){best=x;p=3;}}
      }
      D[IDX(i,j)]=best+d; P[IDX(i,j)]=p;
    }
  }
  // backtrack
  int i=nA-1,j=nB-1; int *map=malloc(nA*4); for(int k=0;k<nA;k++)map[k]=-1;
  int *lo=malloc(nA*4),*hi=malloc(nA*4); for(int k=0;k<nA;k++){lo[k]=1<<30;hi[k]=-1;}
  while(i>=0&&j>=0){
    if(j<lo[i])lo[i]=j; if(j>hi[i])hi[i]=j;
    unsigned char p=P[IDX(i,j)];
    if(i==0&&j==0)break;
    if(p==1){i--;j--;} else if(p==2){i--;} else if(p==3){j--;} else break;
  }
  f=fopen(v[7],"wb"); fwrite(lo,4,nA,f); fwrite(hi,4,nA,f); fclose(f);
  printf("done cost=%f\n", D[IDX(nA-1,nB-1)]);
  return 0;
}
