package com.seamenpool.billing;
public final class K6EProductionPolicyTest {
 public static void main(String[] args) {
  if(ProductionPurchasePolicy.enabled(false)||ProductionPurchasePolicy.enabled(true)||PurchaseTestPolicy.enabled(false)||PurchaseTestPolicy.enabled(true))throw new AssertionError("all defaults OFF");
  for(boolean test:new boolean[]{false,true})for(boolean production:new boolean[]{false,true})for(boolean debug:new boolean[]{false,true}){
   boolean actual=debug?PurchaseTestPolicy.allows(true,test):ProductionPurchasePolicy.allows(false,production);
   if(actual!=(debug?test:production))throw new AssertionError("cross-policy permission");
   if(PurchaseTestPolicy.allows(false,test))throw new AssertionError("debug grants release");
   if(ProductionPurchasePolicy.allows(true,production))throw new AssertionError("production grants debug");
  }
  System.out.println("PASS K6E: both defaults OFF; all eight debug/test/production combinations isolated; debug never grants production");
 }
}
